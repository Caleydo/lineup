/**
 * Created by sam on 04.11.2016.
 */

import LineUp from 'lineupjs/src/lineup';
import {saveAs} from 'file-saver';

export default function exportToCSV(lineup: LineUp, name: string) {
  const first = lineup.data.getRankings()[0];
  lineup.data.exportTable(first).then(function(str) {
    //create blob and save it
    var blob = new Blob([str], {type: 'text/csv;charset=utf-8'});
    saveAs(blob, 'LineUp-' + name + '.csv');
  });
}
