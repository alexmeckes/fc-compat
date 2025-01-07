import express from 'express';
import cors from 'cors';
import { load } from 'cheerio';
import axios from 'axios';

const app = express();
const router = express.Router();

// CORS configuration - allow all origins temporarily for debugging
app.use(cors());

// ... rest of the file stays the same ... 