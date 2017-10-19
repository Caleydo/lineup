/**
 * Created by sam on 04.11.2016.
 */

import {saveAs} from 'file-saver';
import Taggle from 'taggle/src/v2/Taggle';
import ADataProvider from 'lineupjs/src/provider/ADataProvider';

export default function exportToCSV(data: ADataProvider, name: string) {
  const first = data.getRankings()[0];
  data.exportTable(first).then(function(str) {
    //create blob and save it
    const blob = new Blob([str], {type: 'text/csv;charset=utf-8'});
    saveAs(blob, name + '.csv');
  });
}

function dumpLayout(taggle: Taggle) {
  //full spec
  const s = taggle.dump();
  s.columns = (<any>taggle.data).columns;
  s.data = (<any>taggle.data).data;
  //stringify with pretty print
  return JSON.stringify(s, null, '\t');
}

export function exportToJSON(taggle: Taggle, name: string) {
  const str = dumpLayout(taggle);
  const blob = new Blob([str], {type: 'application/json;charset=utf-8'});
  saveAs(blob, name + '.json');
}
