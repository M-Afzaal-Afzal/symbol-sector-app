import axios from 'axios';

export const client = axios.create({
  baseURL: 'https://www.finlytica.com',
  headers: {},
});