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

createHeader(
  <HTMLElement>document.querySelector('#caleydoHeader'),
  {appLink: new AppHeaderLink('LineUp Demos')}
);

const parent = <HTMLDivElement>document.querySelector('#app');

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

var lineup: LineUp = null;

function initLineup(name: string, desc: any, _data: any[]) {
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
  setBusy(false);
}

const dataset = datasets[0];
const desc = dataset.desc;
const file = dataset.url;
d3.dsv(desc.separator || '\t', 'text/plain')(file, (_data) => {
  initLineup(dataset.name, desc, _data);
});

function loadGist(gistid) {
  d3.json('https://api.github.com/gists/' + gistid, (error, gistdesc) => {
    if (error) {
      console.error('cant load gist id: ' + gistid, error);
    } else if (gistdesc) {
      const firstFile = gistdesc.files[Object.keys(gistdesc.files)[0]];
      const content = JSON.parse(firstFile.content);
      initLineup(gistdesc.description, content, content.data);
    }
  });
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
