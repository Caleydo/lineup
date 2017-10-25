/**
 * Created by sam on 04.11.2016.
 */

import {saveAs} from 'file-saver';
import ADataProvider from 'lineupjs/src/provider/ADataProvider';
import {ILineUpLike} from 'lineupjs/src/interfaces';

export default function exportToCSV(data: ADataProvider, name: string) {
  const first = data.getRankings()[0];
  data.exportTable(first).then(function(str) {
    //create blob and save it
    const blob = new Blob([str], {type: 'text/csv;charset=utf-8'});
    saveAs(blob, name + '.csv');
  });
}

function dumpLayout(lineup: ILineUpLike) {
  //full spec
  const s = lineup.dump();
  s.columns = (<any>lineup.data).columns;
  s.data = (<any>lineup.data).data;
  //stringify with pretty print
  return JSON.stringify(s, null, '\t');
}

export function exportToJSON(lineup: ILineUpLike, name: string) {
  const str = dumpLayout(lineup);
  const blob = new Blob([str], {type: 'application/json;charset=utf-8'});
  saveAs(blob, name + '.json');
}
