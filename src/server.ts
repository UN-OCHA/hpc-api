import app from './app';
import { httpPort as PORT } from './config';

app.listen(PORT, () => {
  console.info(`Express server listening on http://localhost:${PORT}`); 
});