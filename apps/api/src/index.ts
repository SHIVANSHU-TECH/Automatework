import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { authRouter } from './controllers/auth.controller';
import { websiteAnalyzerRouter } from './controllers/website-analyzer.controller';
import { proposalRouter } from './controllers/proposal.controller';
import { crmRouter } from './controllers/crm.controller';
import { reportRouter } from './controllers/report.controller';
import { aiRouter } from './controllers/ai.controller';
import { screenshotRouter } from './controllers/screenshot.controller';
// V2 modules
import { leadFinderRouter } from './controllers/lead-finder.controller';
import { linkedinRouter } from './controllers/linkedin-generator.controller';
import { urlShortenerRouter } from './controllers/url-shortener.controller';

dotenv.config();

const app = express();
const port = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());

// V1 routes (unchanged)
app.use('/api/auth', authRouter);
app.use('/api/website-analyzer', websiteAnalyzerRouter);
app.use('/api/proposals', proposalRouter);
app.use('/api/crm', crmRouter);
app.use('/api/reports', reportRouter);
app.use('/api/ai', aiRouter);
app.use('/api/screenshots', screenshotRouter);

// V2 routes
app.use('/api/leads', leadFinderRouter);
app.use('/api/linkedin', linkedinRouter);
app.use('/api/urls', urlShortenerRouter);

// Short URL redirect (public)
app.get('/s/:code', async (req, res) => {
  res.redirect(302, `/api/urls/r/${req.params.code}${req.query.p ? `?p=${req.query.p}` : ''}`);
});

app.use('/reports/files', express.static(path.resolve(__dirname, '../data/reports')));
app.use('/screenshots/files', express.static(path.resolve(__dirname, '../data/screenshots')));

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
