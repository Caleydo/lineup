/**
 * Created by sam on 04.11.2016.
 */

import {create as createHeader, AppHeaderLink} from 'phovea_bootstrap_fontawesome/src/header';
import LineUp from 'lineupjs/src/lineup';
import {LocalDataProvider} from 'lineupjs/src/provider';
import {deriveColors} from 'lineupjs/src';
import * as d3 from 'd3';
import datasets, {IDataSetSpec} from './datasets';

function setBusy(busy = true) {
  const d = <HTMLDivElement>document.querySelector('#app > div.busy');
  d.className = 'busy ' + (busy ? '' : 'hidden');
}

interface IDataSet {
  name: string;
  url: string;
  dump: any;
}

function fixMissing(columns, data) {
  columns.forEach((col) => {
    if (col.type === 'number' && !col.domain) {
      var old = col.domain || [NaN, NaN];
      var minmax = d3.extent(data, (row) => {
        return row[col.column].length === 0 ? undefined : +(row[col.column])
      });
      col.domain = [
        isNaN(old[0]) ? minmax[0] : old[0],
        isNaN(old[1]) ? minmax[1] : old[1]
      ];
    } else if (col.type === 'categorical' && !col.categories) {
      var sset = d3.set(data.map((row) => {
        return row[col];
      }));
      col.categories = sset.values().sort();
    }
  });
}

const lineUpDemoConfig = {
  name: 'No Name',
  htmlLayout: {
    autoRotateLabels: true
  },
  renderingOptions: {
    stacked: true,
    histograms: true,
    animated: true
  },
  svgLayout: {
    freezeCols: 0
  }
};

function initLineup(name: string, desc: any, _data: any[], lineup) {
  document.querySelector('[data-header="appLink"]').innerHTML = 'LineUp - '+name;
  document.title = 'LineUp - ' + name;
  fixMissing(desc.columns, _data);
  const provider = new LocalDataProvider(_data, deriveColors(desc.columns));
  lineUpDemoConfig.name = name;
  if (lineup) {
    lineup.changeDataStorage(provider, desc);
  } else {
    lineup = new LineUp(document.getElementById('lugui-wrapper'), provider, lineUpDemoConfig);
    lineup.addPool(document.getElementById('pool'), {
      hideUsed: false
    }).update();
    lineup.restore(desc);//TODO: why?
  }
  provider.deriveDefault();
  lineup.update();

  //sort by stacked columns
  var cols = provider.getRankings();
  cols.forEach((rankCol) => {
    rankCol.children.forEach((col) => {
      if (col.desc.type === 'stack')
        col.sortByMe();
    })
  });
  return lineup;
}

function loadGist(gistid) {
  return new Promise((resolve, reject) => {
    d3.json('https://api.github.com/gists/' + gistid, (error, gistdesc) => {
      if (error) {
        console.error('cant load gist id: ' + gistid, error);
        reject('cant load');
      } else if (gistdesc) {
        const firstFile = gistdesc.files[Object.keys(gistdesc.files)[0]];
        const content = JSON.parse(firstFile.content);
        resolve({name: gistdesc.description, desc: content, data: content.data});
      }
      reject('not found');
    });
  });
}

function dumpLayout(lineup) {
  //full spec
  var s = lineup.dump();
  s.columns = (<any>lineup.data).columns;
  s.data = (<any>lineup.data).data;

  //stringify with pretty print
  return JSON.stringify(s, null, '\t');
}

function saveToGist(lineup) {
  //stringify with pretty print
  const str = dumpLayout(lineup);
  const args = {
    'description': lineUpDemoConfig.name,
    'public': true,
    'files': {
      'lineup.json': {
        'content': str
      }
    }
  };
  d3.json('https://api.github.com/gists').post(JSON.stringify(args), (error, data) => {
    if (error) {
      console.log('cant store to gist', error);
    } else {
      var id = data.id;
      document.title = 'LineUp - ' + (args.description || 'Custom');
      history.pushState({id: 'gist:' + id}, 'LineUp - ' + (args.description || 'Custom'), '#gist:' + id);
    }
  });
}

function saveAs(blob: Blob, name: string) {
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(blob);
  (<any>downloadLink).download = name + '.csv';

  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

function exportToCSV(lineup) {
  const first = lineup.data.getRankings()[0];
  lineup.data.exportTable(first).then(function(str) {
    //create blob and save it
    var blob = new Blob([str], {type: 'text/csv;charset=utf-8'});
    saveAs(blob, 'LineUp-' + lineUpDemoConfig.name + '.csv');
  });
}

{
  const header = createHeader(
    <HTMLElement>document.querySelector('#caleydoHeader'),
    {appLink: new AppHeaderLink('LineUp Demos')}
  );
  var lineup: LineUp = null;

  header.addRightMenu(`<i class="fa fa-download"></i>`, () => {
    if (lineup) {
      exportToCSV(lineup);
    }
  });
  header.addRightMenu(`<i class="fa fa-github"></i>`, () => {
    if (lineup) {
      saveToGist(lineup);
    }
  });
  header.rightMenu.insertBefore(document.getElementById('datasetSelector'), header.rightMenu.firstChild);

  const parent = <HTMLDivElement>document.querySelector('#app');

  const loadDataset = (dataset: IDataSetSpec) => {
    const desc = dataset.desc;
    const file = dataset.url;
    setBusy(true);
    d3.dsv(desc.separator || '\t', 'text/plain')(file, (_data) => {
      lineup = initLineup(dataset.name, desc, _data, lineup);
      setBusy(false);
    });
  };

  {
    let base = <HTMLElement>document.querySelector('#datasetSelector ul');
    datasets.forEach((d) => {
      const li = document.createElement('li');
      li.innerHTML = `<a href="#${d.id}">${d.name}</a>`;
      li.firstElementChild.addEventListener('click', (event) => {
        loadDataset(d);
      });
      base.appendChild(li);
    });
  }
  var old = history.state ? history.state.id : (window.location.hash ? window.location.hash.substr(1) : '');
  if (old.match(/gist:.*/)) {
    let id = old;
    let name = 'Github Gist ' + old.substr(5);
    let gist = old.substr(5);
    loadGist(gist).then(({name, desc, data}) => {
      lineup = initLineup(name, desc, data, lineup);
      setBusy(false);
    });
  } else {
    let choose = datasets.filter((d) => d.id === old);
    if (choose.length > 0) {
      loadDataset(choose[0]);
    } else {
      loadDataset(datasets[0]);
    }
  }
}
//
//
// function dumpLayout() {
//   //full spec
//   var s = lineup.dump();
//   s.columns = lineup.data.columns;
//   s.data = lineup.data.data;
//
//   //stringify with pretty print
//   return JSON.stringify(s, null, '\t');
// }
//
// function saveLayout() {
//   //stringify with pretty print
//   var str = dumpLayout();
//   //create blob and save it
//   var blob = new Blob([str], {type: 'application/json;charset=utf-8'});
//   saveAs(blob, 'LineUp-' + lineUpDemoConfig.name + '.json');
// }
//
// function exportToCSV() {
//   var first = lineup.data.getRankings()[0];
//   lineup.data.exportTable(first).then(function (str) {
//     //create blob and save it
//     var blob = new Blob([str], {type: 'text/csv;charset=utf-8'});
//     saveAs(blob, 'LineUp-' + lineUpDemoConfig.name + '.csv');
//   });
// }
//
// function saveToGist() {
//   //stringify with pretty print
//   var str = dumpLayout();
//   var args = {
//     'description': lineUpDemoConfig.name,
//     'public': true,
//     'files': {
//       'lineup.json': {
//         'content': str
//       }
//     }
//   };
//   d3.json('https://api.github.com/gists').post(JSON.stringify(args), function (error, data) {
//     if (error) {
//       console.log('cant store to gist', error);
//     } else {
//       var id = data.id;
//       document.title = 'LineUp - ' + (args.description || 'Custom');
//       history.pushState({id: 'gist:' + id}, 'LineUp - ' + (args.description || 'Custom'), '#gist:' + id);
//     }
//   });
// }
//
// d3.json('datasets.json', function (error, data) {
//     //console.log('datasets:', data, error);
//
//     //setup dataset select
//     datasets = data.datasets;
//     var $selector = d3.select('#lugui-dataset-selector');
//     var ds = $selector.selectAll('option').data(data.datasets);
//     ds.enter().append('option')
//       .attr('value', function (d, i) {
//         return i;
//       }).text(function (d) {
//       return d.name;
//     });
//     $selector.on('change', function () {
//       loadDataset(datasets[this.value]);
//     });
//
//     //load data and init lineup
//
//     var old = history.state ? history.state.id : (window.location.hash ? window.location.hash.substr(1) : '');
//     if (old.match(/gist:.*/)) {
//       loadDataset({
//         name: 'Github Gist '+old.substr(5),
//         id: old,
//         gist: old.substr(5)
//       });
//     } else {
//       var choose = datasets.filter(function (d) {
//         return d.id === old;
//       })
//       if (choose.length > 0) {
//         $selector.property('value', datasets.indexOf(choose[0]));
//         loadDataset(choose[0]);
//       } else {
//         loadDataset(datasets[0]);
//       }
//     }
//
//     loadLayout();
//   });
