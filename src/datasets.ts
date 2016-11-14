/**
 * Created by sam on 04.11.2016.
 */

import * as dataSP500 from 'file-loader!./data/sp500_2015-06-26.csv';
import * as descSP500 from './data/sp500.json';
import * as dataWUR from 'file-loader!./data/wur2013.txt';
import * as descWUR from './data/data.json';
import * as descWURSmall from './data/data_small.json';
import * as dataProsperity from 'file-loader!./data/2015_Variables.csv';
import * as descProsperity from './data/prosperity.json';

export interface IDataSetSpec {
  id: string;
  name: string;
  desc: any;
  url: string;
}
const data: IDataSetSpec[] = [
  {
    id: 'prosperity',
    name: 'Legatum Prosperity Index',
    desc: descProsperity,
    url: dataProsperity
  },
  {
    id: 'uni',
    name: 'University Rankings',
    desc: descWURSmall,
    url: dataWUR
  },
  {
    id: 'uni_big',
    name: 'University Ranking bigger',
    desc: descWUR,
    url: dataWUR
  },
  {
    id: 'sp500',
    name: 'SP500 2015-06-26',
    desc: descSP500,
    url: dataSP500
  }
];

export default data;
