import path from 'path';
import gland from '../dist';
const g = new gland();
g.load({ path: path.join(__dirname, 'router') });
g.init(3000, () => {
  console.log('server run on port 3000');
});
