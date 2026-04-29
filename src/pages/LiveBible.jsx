import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel, 
  useTheme,
  TextField,
  IconButton,
  Stack,
  CircularProgress,
  Snackbar,
  Alert,
  Paper
} from '@mui/material';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { BIBLE_VERSIONS } from '../data/bibleData';
import { fetchBooks, fetchChapters, fetchChapterContent, translateToGenZ, VERSION_MAP } from '../utils/bibleApi';

const LiveBible = () => {
  const theme = useTheme();
  
  const [books, setBooks] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [currentVerses, setCurrentVerses] = useState([]);
  const [loadingVerses, setLoadingVerses] = useState(false);
  
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('KJV');
  const [searchTerm, setSearchTerm] = useState('');

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const bibleId = VERSION_MAP[selectedVersion] || VERSION_MAP.KJV;
        const data = await fetchBooks(bibleId);
        setBooks(data);
        if (data.length > 0) {
          setSelectedBookId(prev => prev || data[0].id);
        }
      } catch (error) { // eslint-disable-line no-unused-vars
        setSnackbar({ open: true, message: "Failed to connect to Bible API.", severity: "error" });
      }
    };
    loadBooks();
  }, [selectedVersion]);

  useEffect(() => {
    if (!selectedBookId) return;
    const loadChapters = async () => {
      try {
        const bibleId = VERSION_MAP[selectedVersion] || VERSION_MAP.KJV;
        const data = await fetchChapters(bibleId, selectedBookId);
        setChapters(data);
        if (data[0]) setSelectedChapterId(data[0].id);
      } catch (error) { console.error(error); }
    };
    loadChapters();
  }, [selectedBookId, selectedVersion]);

  useEffect(() => {
    if (!selectedChapterId) return;
    const loadContent = async () => {
      setLoadingVerses(true);
      try {
        const bibleId = VERSION_MAP[selectedVersion] || VERSION_MAP.KJV;
        const data = await fetchChapterContent(bibleId, selectedChapterId);
        
        const verseMap = {};
        const verseOrder = [];
        const walk = (items) => {
          if (!items) return;
          items.forEach(item => {
            if (item.type === 'text' && item.attrs?.verseId) {
              const vId = item.attrs.verseId;
              const vNum = vId.split('.').pop();
              if (!verseMap[vId]) { verseMap[vId] = { number: vNum, text: "" }; verseOrder.push(vId); }
              verseMap[vId].text += item.text;
            }
            if (item.items) walk(item.items);
          });
        };
        if (data.content) walk(data.content);
        const versesList = verseOrder.map(id => ({ number: verseMap[id].number, text: selectedVersion === 'GENZ' ? translateToGenZ(verseMap[id].text) : verseMap[id].text }));
        setCurrentVerses(versesList);
      } catch (error) { // eslint-disable-line no-unused-vars
         setCurrentVerses([]); 
      } finally { setLoadingVerses(false); }
    };
    loadContent();
  }, [selectedChapterId, selectedVersion]);

  const currentBookName = books.find(b => b.id === selectedBookId)?.name || "";
  const currentChapterName = chapters.find(c => c.id === selectedChapterId)?.number || "";

  return (
    <Box sx={{ pb: 10 }}>
      {/* Header */}
      <Box sx={{ mb: 8, textAlign: 'center' }}>
        <Typography variant="overline" color="primary" fontWeight={800} letterSpacing={3}>HOLY SCRIPTURE</Typography>
        <Typography variant="h2" sx={{ fontWeight: 900, mt: 1 }}>Live Bible</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2, maxWidth: 600, mx: 'auto' }}>
             Real-time access to the sacred texts across multiple translations.
        </Typography>
      </Box>

      {/* Selector Grid */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Translation</InputLabel>
            <Select value={selectedVersion} label="Translation" onChange={(e) => setSelectedVersion(e.target.value)}>
              {BIBLE_VERSIONS.map(v => <MenuItem key={v.id} value={v.id}>{v.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Book</InputLabel>
            <Select value={selectedBookId} label="Book" onChange={(e) => setSelectedBookId(e.target.value)}>
              {books.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Chapter</InputLabel>
            <Select value={selectedChapterId} label="Chapter" onChange={(e) => setSelectedChapterId(e.target.value)}>
              {chapters.map(c => <MenuItem key={c.id} value={c.id}>{c.number}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <TextField fullWidth placeholder="Find verse..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </Grid>
      </Grid>

      {/* Reader */}
      <Paper elevation={0} sx={{ p: { xs: 4, md: 10 }, borderRadius: 0, border: `1px solid ${theme.palette.divider}`, minHeight: 600 }}>
          {loadingVerses ? <CircularProgress /> : (
              <Box>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 8 }}>
                    <Typography variant="h3" sx={{ fontFamily: 'Merriweather', fontWeight: 900 }}>{currentBookName} {currentChapterName}</Typography>
                    <Stack direction="row" spacing={2}>
                        <IconButton disabled={chapters.findIndex(c => c.id === selectedChapterId) === 0} onClick={() => { const idx = chapters.findIndex(c => c.id === selectedChapterId); setSelectedChapterId(chapters[idx-1].id); }}><ChevronLeft/></IconButton>
                        <IconButton disabled={chapters.findIndex(c => c.id === selectedChapterId) === chapters.length-1} onClick={() => { const idx = chapters.findIndex(c => c.id === selectedChapterId); setSelectedChapterId(chapters[idx+1].id); }}><ChevronRight/></IconButton>
                    </Stack>
                  </Stack>
                  
                  <Stack spacing={4}>
                      {currentVerses.filter(v => v.text.toLowerCase().includes(searchTerm.toLowerCase())).map((v) => (
                          <Box key={v.number} sx={{ display: 'flex', gap: 4 }}>
                              <Typography variant="caption" fontWeight={900} color="primary" sx={{ mt: 1, minWidth: 20 }}>{v.number}</Typography>
                              <Typography variant="body1" sx={{ fontFamily: 'Lora', fontSize: '1.2rem', lineHeight: 2 }}>{v.text}</Typography>
                          </Box>
                      ))}
                  </Stack>
              </Box>
          )}
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({...snackbar, open: false})}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default LiveBible;
