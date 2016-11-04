/**
 * Created by sam on 04.11.2016.
 */

import {create as createHeader, AppHeaderLink} from 'phovea_bootstrap_fontawesome/src/header';
import LineUp from 'lineupjs/src/lineup';
import {LocalDataProvider} from 'lineupjs/src/provider';
import {deriveColors} from 'lineupjs/src';
import * as d3 from 'd3';

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

const sp500 = System.import('./datasets/sp500/index');

sp500.then((m: IDataSet) => {
  console.log(m);
  const desc = m.dump;
  const file = m.url;
  d3.dsv(desc.separator || '\t', 'text/plain')(file, (_data) => {
    initLineup(m.name, desc, _data);
  });
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
