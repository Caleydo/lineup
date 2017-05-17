/**
 * Created by sam on 04.11.2016.
 */

import LineUp from 'lineupjs/src/lineup';
import {saveAs} from 'file-saver';

export default function exportToCSV(lineup: LineUp, name: string) {
  const first = lineup.data.getRankings()[0];
  lineup.data.exportTable(first).then(function(str) {
    //create blob and save it
    const blob = new Blob([str], {type: 'text/csv;charset=utf-8'});
    saveAs(blob, name + '.csv');
  });
}

function dumpLayout(lineup: LineUp) {
  //full spec
  const s = lineup.dump();
  s.columns = (<any>lineup.data).columns;
  s.data = (<any>lineup.data).data;

  //stringify with pretty print
  return JSON.stringify(s, null, '\t');
}

export function exportToJSON(lineup: LineUp, name: string) {
  const str = dumpLayout(lineup);
  const blob = new Blob([str], {type: 'application/json;charset=utf-8'});
  saveAs(blob, name + '.json');
}
