/**
 * Created by sam on 04.11.2016.
 */

import {create as createHeader, AppHeaderLink} from 'phovea_bootstrap_fontawesome/src/header';
import LineUp from 'lineupjs/src/lineup';
import {LocalDataProvider} from 'lineupjs/src/provider';


function setBusy(busy = true) {
  const d = <HTMLDivElement>document.querySelector('#app > div.busy');
  d.className = 'busy '+(busy ? '': 'hidden');
}

createHeader(
  <HTMLElement>document.querySelector('#caleydoHeader'),
  { appLink: new AppHeaderLink('LineUp Demos') }
);

const parent = <HTMLDivElement>document.querySelector('#app');

interface IDataSet {
  name: string;
  url: string;
  dump: any;
}

const sp500 = System.import('./datasets/sp500/index');

sp500.then((module: IDataSet) => {
  console.log(module);
})
