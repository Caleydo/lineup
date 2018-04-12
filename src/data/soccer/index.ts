/**
 * Created by Samuel Gratzl on 18.07.2017.
 */


import {columns as rawColumns} from './AIDS_Countries.json';
import {columns as matrixColumns} from './AIDS_matrices.json';
import {csv, text} from 'd3';
import {IStratification} from '../../taggle/splicer';

import * as csvCountries from 'file-loader!./AIDS_Countries.csv';
import * as csvLivingHIV from 'file-loader!./AIDS_living_HIV.csv';
import * as csvLivingHIVNormalized from 'file-loader!./AIDS_living_HIV_normalized.csv';
import * as csvNewHIVInfections from 'file-loader!./AIDS_new_HIV_infections.csv';
import * as csvNewHIVInfectionsNormalized from 'file-loader!./AIDS_new_HIV_infections_normalized.csv';
import * as csvOnART from 'file-loader!./AIDS_on_ART.csv';
import * as csvOnARTNormalized from 'file-loader!./AIDS_on_ART_normalized.csv';
import * as csvOrphans from 'file-loader!./AIDS_orphans.csv';
import * as csvOrphansNormalized from 'file-loader!./AIDS_orphans_normalized.csv';
import * as csvRelatedDeaths from 'file-loader!./AIDS_related_deaths.csv';
import * as csvRelatedDeathsNormalized from 'file-loader!./AIDS_related_deaths_normalized.csv';
import * as csvYears from 'raw-loader!./AIDS_Years.csv';

function parseValue(v: string, col: any) {
  switch (col.type) {
    case 'number':
    case 'real':
      return parseFloat(v);
    case 'int':
      return parseInt(v, 10);
    default:
      return v;
  }
}

export interface IRow {
  [key: string]: string | number;
}

function clean(v: string) {
  return v.replace(/[.\s;%-,()]+/mg,'');
}

export const desc = (() => {
  const desc = rawColumns;

  const years = csv.parse(csvYears).map((d) => d.AIDS_Years); // first column
  matrixColumns.forEach((m) => {
    desc.push({
      type: 'numbers',
      domain: m.value.range,
      column: m.name,
      dataLength: m.size[1],
      colorRange: ['white', 'black'],
      labels: years
    });
  });
  desc.forEach((d) => {
    d.label = d.column;
    d.column = clean(d.column);
  });
  const defaultColumns = ['AIDS_Countries',
        'Continent',
        'Human devel. index',
        'Ppl knowing they have HIV (%, 2015)',
        'N. new HIV infections per 1000 ppl', // matrix
        'AIDS related deaths per 1000 ppl', // matrix
        'Discriminatory attitude scale',
        'Urban Pop (%)'];
  return {
    columns: desc,
    layout: {
      primary: [
      {
        type: 'aggregate'
      },
      {
        type: 'group',
        width: 150
      },
      {
        type: 'rank'
      },
      {
        type: 'selection'
      },
        ...defaultColumns.map((d) => ({column: clean(d)}))
      ]
    }
  };
})();

export function loader() {
  return new Promise<any[]>((resolve) => {

    const data = csv(csvCountries, (rawRow) => {
      const r: any = {};
      rawColumns.forEach((col: any) => {
        const v = rawRow[col.label];
        r[col.column] = parseValue(v, col);
      });
      return r;
    }, (_error, data) => {
      resolve(data);
    });
  }).then((data) => {
    function integrateMatrix(desc: any, file: string) {
      //skip header and first column
      return new Promise((resolve) => {
        text(file, (loaded) => {
          const m = csv.parseRows(loaded).map((row, i) => i === 0 ? row.slice(1) : row.slice(1).map((v) => parseValue(v, {type: desc.value.type}))).slice(1);
          data.forEach((row, i) => row[clean(desc.name)] = m[i]);
          resolve();
        });
      });
     }
    return Promise.all([
      integrateMatrix(matrixColumns[0], csvLivingHIV),
      integrateMatrix(matrixColumns[1], csvLivingHIVNormalized),
      integrateMatrix(matrixColumns[2], csvNewHIVInfections),
      integrateMatrix(matrixColumns[3], csvNewHIVInfectionsNormalized),
      integrateMatrix(matrixColumns[4], csvRelatedDeaths),
      integrateMatrix(matrixColumns[5], csvRelatedDeathsNormalized),
      integrateMatrix(matrixColumns[6], csvOnART),
      integrateMatrix(matrixColumns[7], csvOnARTNormalized),
      integrateMatrix(matrixColumns[8], csvOrphans),
      integrateMatrix(matrixColumns[9], csvOrphansNormalized)
    ]).then(() => {
      return data;
    });
  });
}

export const defaultColumns: string[] = [

];


function parseStratifications() {
  const data = csv.parse(csvYears);

  const descs = [
    {
        name: 'Decades',
        value: {
          categories: [
            {
              color: '#d7b5d8',
              name: '1990s'
            },
            {
              color: '#df65b0',
              name: '2000s'
            },
            {
              color: '#dd1c77',
              name: '2010s'
            }
          ]
        }
      },
      {
        name: 'HAART availability',
        value: {
          categories: [
            {
              color: '#fbb4ae',
              name: '1 pre HAART period'
            },
            {
              color: '#b3cde3',
              name: '2 A Decade of HAART'
            },
            {
              color: '#ccebc5',
              name: '3 multiple medications available'
            }
          ]
        }
      }
  ];

  return descs.map((d) => {
    return {
      name: d.name,
      categories: d.value.categories,
      data: data.map((r) => r[d.name])
    };
  });
}

export const stratifications: IStratification[] = parseStratifications();
