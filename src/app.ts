/**
 * Created by sam on 04.11.2016.
 */

import {create as createHeader, AppHeaderLink} from 'phovea_bootstrap_fontawesome/src/header';
import LineUp from 'lineupjs/src/lineup';
import {LocalDataProvider} from 'lineupjs/src/provider';
import {createStackDesc, createNestedDesc, createScriptDesc} from 'lineupjs/src/model';
import {deriveColors} from 'lineupjs/src';
import * as d3 from 'd3';
import datasets, {IDataSetSpec} from './datasets';
import {load as loadGist, save as saveToGist} from './gist';
import exportToCSV from './export';
import importTable from './importer';

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
        return row[col.column].length === 0 ? undefined : +(row[col.column]);
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
  header: {
    autoRotateLabels: true
  },
  renderingOptions: {
    stacked: true,
    histograms: true,
    animated: true
  },
  body: {
    freezeCols: 0,
    renderer: 'canvas'
  }
};

function initLineup(name: string, desc: any, _data: any[], lineup?: LineUp) {
  document.querySelector('[data-header="appLink"]').innerHTML = 'LineUp - '+name;
  document.title = 'LineUp - ' + name;
  fixMissing(desc.columns, _data);
  const provider = new LocalDataProvider(_data, deriveColors(desc.columns));
  if (lineup) {
    lineup.changeDataStorage(provider, desc);
  } else {
    lineup = new LineUp(document.getElementById('lugui-wrapper'), provider, lineUpDemoConfig);
    lineup.addPool(document.getElementById('pool'), {
      hideUsed: false,
      elemWidth: 120,
      elemHeight: 30,
      layout: 'grid',
      width: 360,
      addAtEndOnClick: true,
      additionalDesc: [
        createStackDesc(),
        createNestedDesc(),
        createScriptDesc()
      ]
    }).update();
  }
  provider.deriveDefault();
  lineup.update();

  //sort by stacked columns
  var cols = provider.getRankings();
  cols.forEach((rankCol) => {
    rankCol.children.forEach((col) => {
      if (col.desc.type === 'stack') {
        col.sortByMe();
      }
    });
  });
  return lineup;
}

{
  const header = createHeader(
    <HTMLElement>document.querySelector('#caleydoHeader'),
    {appLink: new AppHeaderLink('LineUp Demos')}
  );
  var currentName = 'No Name';
  var lineup: LineUp = null;

  header.addRightMenu(`<i class="fa fa-download"></i>`, () => {
    if (lineup) {
      exportToCSV(lineup, currentName);
    }
  });
  header.addRightMenu(`<i class="fa fa-github"></i>`, () => {
    if (lineup) {
      saveToGist(lineup, currentName);
    }
  });
  header.mainMenu.appendChild(document.getElementById('poolSelector'));
  header.rightMenu.insertBefore(document.getElementById('datasetSelector'), header.rightMenu.firstChild);
  header.addRightMenu(`<i class="fa fa-upload"></i>`, () => {
    importTable().then(({name, desc, data}) => {
      lineup = initLineup(name, desc, data, lineup);
      setBusy(false);
    }).catch(() => {
      // aborted ok
    });
  });

  const loadDataset = (dataset: IDataSetSpec) => {
    const desc = dataset.desc;
    const file = dataset.url;
    setBusy(true);
    currentName = dataset.name;
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
    let name = 'Github Gist ' + old.substr(5);
    let gist = old.substr(5);
    currentName = name;
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
