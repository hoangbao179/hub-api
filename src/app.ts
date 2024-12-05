import * as dotenv from "dotenv";
dotenv.config();
import express from 'express';
import bodyParser from 'body-parser';
import router from './routers';
const app = express();

app.use(bodyParser.json());

app.use('/api', router);  

app.listen(8080, () => {
    console.log('Server is running on port 8080');
});

export default app;
