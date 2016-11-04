/**
 * Created by sam on 04.11.2016.
 */

import LineUp from 'lineupjs/src/lineup';

function saveAs(blob: Blob, name: string) {
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(blob);
  (<any>downloadLink).download = name + '.csv';

  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

export default function exportToCSV(lineup: LineUp, name: string) {
  const first = lineup.data.getRankings()[0];
  lineup.data.exportTable(first).then(function(str) {
    //create blob and save it
    var blob = new Blob([str], {type: 'text/csv;charset=utf-8'});
    saveAs(blob, 'LineUp-' + name + '.csv');
  });
}
