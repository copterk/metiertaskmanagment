
import app from './app';
// Dotenv config is already in app.ts, but we might need it earlier if we had other imports
// For now, app.ts handles it.

const PORT = 3001;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Environment:', process.env.NODE_ENV || 'development');
});
