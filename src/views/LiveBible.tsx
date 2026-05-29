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
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="overline" color="secondary.main" className="serif-title" sx={{ fontWeight: 800, letterSpacing: '0.25em', fontSize: '0.7rem' }}>HOLY SCRIPTURE</Typography>
        <Typography variant="h3" className="serif-title" sx={{ fontWeight: 700, mt: 1, color: 'primary.main', fontSize: { xs: '1.8rem', md: '2.5rem' } }}>The Live Bible</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, maxWidth: 600, mx: 'auto', fontSize: '0.85rem', letterSpacing: '0.01em' }}>
          Real-time access to the sacred texts across multiple translations.
        </Typography>
      </Box>

      {/* Selector Grid */}
      <Grid container spacing={2.5} sx={{ mb: 5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel>Translation</InputLabel>
            <Select value={selectedVersion} label="Translation" onChange={(e) => setSelectedVersion(e.target.value)}>
              {BIBLE_VERSIONS.map(v => <MenuItem key={v.id} value={v.id}>{v.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel>Book</InputLabel>
            <Select value={selectedBookId} label="Book" onChange={(e) => setSelectedBookId(e.target.value)}>
              {books.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel>Chapter</InputLabel>
            <Select value={selectedChapterId} label="Chapter" onChange={(e) => setSelectedChapterId(e.target.value)}>
              {chapters.map(c => <MenuItem key={c.id} value={c.id}>{c.number}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField fullWidth placeholder="Search verse..." size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </Grid>
      </Grid>

      {/* Reader styled as a majestic opened Bible parchment page */}
      <Paper 
        elevation={0} 
        className="double-border"
        sx={{ 
          p: { xs: 4, md: 8 }, 
          bgcolor: theme.palette.mode === 'light' ? '#FCFAF6' : '#111723', 
          border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(182, 146, 77, 0.25)' : 'rgba(227, 193, 127, 0.18)'}`,
          minHeight: 600,
          position: 'relative',
        }}
      >
          {loadingVerses ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
              <CircularProgress size={30} color="secondary" />
            </Box>
          ) : (
              <Box>
                  <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    spacing={2} 
                    sx={{ 
                      justifyContent: "space-between", 
                      alignItems: "center", 
                      mb: 6, 
                      pb: 3, 
                      borderBottom: `1px solid ${theme.palette.divider}` 
                    }}
                  >
                    <Typography variant="h4" className="serif-title" sx={{ fontWeight: 700, fontSize: { xs: '1.35rem', md: '1.75rem' }, color: 'primary.main' }}>
                      {currentBookName} {currentChapterName}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <IconButton 
                          disabled={chapters.findIndex(c => c.id === selectedChapterId) === 0} 
                          onClick={() => { const idx = chapters.findIndex(c => c.id === selectedChapterId); setSelectedChapterId(chapters[idx-1].id); }}
                          size="small"
                          sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}
                        >
                          <ChevronLeft size={16} />
                        </IconButton>
                        <IconButton 
                          disabled={chapters.findIndex(c => c.id === selectedChapterId) === chapters.length-1} 
                          onClick={() => { const idx = chapters.findIndex(c => c.id === selectedChapterId); setSelectedChapterId(chapters[idx+1].id); }}
                          size="small"
                          sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}
                        >
                          <ChevronRight size={16} />
                        </IconButton>
                    </Stack>
                  </Stack>
                  
                  <Stack spacing={3.5}>
                      {currentVerses.filter(v => v.text.toLowerCase().includes(searchTerm.toLowerCase())).map((v) => (
                          <Box key={v.number} sx={{ display: 'flex', gap: 3.5, alignItems: 'flex-start' }}>
                              <Typography 
                                variant="body2" 
                                className="serif-title"
                                sx={{ 
                                  fontWeight: 800, 
                                  color: 'secondary.main', 
                                  minWidth: 24, 
                                  textAlign: 'right', 
                                  mt: 0.5,
                                  fontSize: '0.8rem',
                                  userSelect: 'none'
                                }}
                              >
                                {v.number}
                              </Typography>
                              <Typography 
                                variant="body1" 
                                className="serif-body" 
                                sx={{ 
                                  fontSize: { xs: '1.05rem', md: '1.18rem' }, 
                                  lineHeight: 1.85, 
                                  color: 'text.primary' 
                                }}
                              >
                                {v.text}
                              </Typography>
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
