/**
 * Created by Samuel Gratzl on 18.07.2017.
 */


import {columns as rawColumns} from './soccerplayers.json';
import {columns as matrixColumns} from './soccermatrices.json';
import {csv, text} from 'd3';
import {IStratification} from '../../taggle/splicer';

import * as csvPlayers from 'file-loader!./soccerplayers.csv';
import * as csvMinutes from 'file-loader!./minutes.csv';
import * as csvGoals from 'file-loader!./goals.csv';
import * as csvAssists from 'file-loader!./assists.csv';
import * as csvGames from 'file-loader!./games.csv';
import * as csvSeasons from 'raw-loader!./soccerseasons.csv';

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
  return v.replace(/[.\s;%-,()]+/mg, '');
}

export const desc = (() => {
  const desc = rawColumns;

  const seasons = csv.parse(csvSeasons).map((d) => d.season); // first column
  matrixColumns.forEach((m) => {
    desc.push({
      type: 'numbers',
      domain: m.value.range,
      column: m.name,
      dataLength: m.size[1],
      colorRange: ['white', 'black'],
      labels: seasons   
    });
  });
  desc.forEach((d) => {
    d.label = d.column;
    d.column = clean(d.column);
  });
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
        {
            column: 'soccerplayers',
            width: 150
        },
        {
            column: 'currentleague'
        },
        {
            column: 'currentclub',
            width: 100
        },
        {
            column: 'position'
        },
        {
            column: 'foot'
        },
        {
            column: 'age'
        },
        {
            column: 'height'
        },
        {
            column: 'goals',
            width: 300
        },
        {
            column: 'games',
            width: 300
        }
      ]
    }
  };
})();

export function loader() {
  return new Promise<any[]>((resolve) => {

    const data = csv(csvPlayers, (rawRow) => {
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
      integrateMatrix(matrixColumns[0], csvAssists),
      integrateMatrix(matrixColumns[1], csvGames),
      integrateMatrix(matrixColumns[2], csvGoals),
      integrateMatrix(matrixColumns[3], csvMinutes),
    ]).then(() => {
      return data;
    });
  });
}

export const defaultColumns: string[] = [];


function parseStratifications() {
  const data = csv.parse(csvSeasons);

  const descs = [
    {
      name: 'season',
      value: {
        categories: [
          '12/13',
          '13/14',
          '14/15',
          '15/16',
          '16/17',
          '17/18',
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
