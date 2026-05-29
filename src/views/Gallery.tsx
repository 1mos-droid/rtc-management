import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Button, 
  IconButton, 
  useTheme, 
  CircularProgress, 
  Dialog,
  alpha,
  Paper,
  Stack,
  TextField,
  Card,
  CardMedia,
  CardContent,
  Tooltip
} from '@mui/material';
import { 
  Camera, 
  Upload, 
  Trash2, 
  X, 
  Plus, 
  Calendar,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { safeParseDate } from '../utils/dateUtils';
import { uploadFile, deleteFile } from '@huggingface/hub';

const Gallery = () => {
  const theme = useTheme();
  const { user, isAdmin, isPastor, isDeptHead } = useAuth();
  const { showNotification, showConfirmation } = useWorkspace();
  const canManage = isAdmin || isPastor || isDeptHead;

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);
  const [newImage, setNewImage] = useState({
    file: null,
    preview: '',
    description: '',
    service_date: format(new Date(), 'yyyy-MM-dd')
  });

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_images')
        .select('*')
        .order('service_date', { ascending: false });
      
      if (error) throw error;
      setImages(data || []);
    } catch (err) {
      console.error("Fetch Gallery Error:", err);
      showNotification("Failed to load gallery.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchImages();
    
    const channel = supabase
      .channel('gallery-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_images' }, fetchImages)
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchImages]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotification("Image size must be less than 5MB.", "warning");
        return;
      }
      setNewImage({
        ...newImage,
        file,
        preview: URL.createObjectURL(file)
      });
    }
  };

  const handleUpload = async () => {
    if (!newImage.file || !user) return;
    
    setUploading(true);
    try {
      const fileExt = newImage.file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `gallery/${fileName}`;

      const hfToken = process.env.NEXT_PUBLIC_HF_TOKEN || '';
      const hfRepo = process.env.NEXT_PUBLIC_HF_REPO || '';

      if (!hfToken || !hfRepo || hfToken.includes('placeholder') || hfRepo.includes('your-dataset')) {
        throw new Error("Hugging Face configurations are missing or using placeholder values. Please check your credentials.");
      }

      // 1. Upload to Hugging Face Hub Dataset Repository
      await uploadFile({
        repo: { type: "dataset", name: hfRepo },
        accessToken: hfToken,
        file: {
          path: filePath,
          content: newImage.file
        }
      });

      // 2. Generate the Hugging Face Resolve URL
      const publicUrl = `https://huggingface.co/datasets/${hfRepo}/resolve/main/${filePath}`;

      // 3. Save Metadata to DB
      const { error: dbError } = await supabase.from('service_images').insert([{
        url: publicUrl,
        description: newImage.description,
        service_date: new Date(newImage.service_date).toISOString(),
        uploaded_by: user.id
      }]);

      if (dbError) throw dbError;

      showNotification("Image saved to gallery on Hugging Face!", "success");
      setUploadDialogOpen(false);
      setNewImage({ file: null, preview: '', description: '', service_date: format(new Date(), 'yyyy-MM-dd') });
    } catch (err: any) {
      console.error("Upload Error:", err);
      showNotification(err.message || "Failed to upload image to Hugging Face.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id, url) => {
    showConfirmation({
      title: "Delete Image",
      message: "Are you sure you want to remove this image from the gallery?",
      onConfirm: async () => {
        try {
          // Extract file path from URL
          const parts = url.split('resolve/main/');
          const path = parts.length > 1 ? parts[1] : `gallery/${url.split('/').pop()}`;

          const hfToken = process.env.NEXT_PUBLIC_HF_TOKEN || '';
          const hfRepo = process.env.NEXT_PUBLIC_HF_REPO || '';

          if (hfToken && hfRepo && !hfToken.includes('placeholder')) {
            // Delete from Hugging Face Storage
            await deleteFile({
              repo: { type: "dataset", name: hfRepo },
              accessToken: hfToken,
              path: path
            });
          }
          
          // Delete from DB
          const { error } = await supabase.from('service_images').delete().eq('id', id);
          if (error) throw error;
          
          showNotification("Image removed.");
          setViewingImage(null);
        } catch (err: any) {
          console.error("Delete Error:", err);
          showNotification(err.message || "Deletion failed.", "error");
        }
      }
    });
  };

  return (
    <Box>
      <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h2">Service Gallery</Typography>
            <Typography variant="body1" color="text.secondary">Capturing moments of worship and fellowship.</Typography>
          </Box>
          <Button 
            variant="contained" 
            color="secondary"
            startIcon={<Plus size={18} />} 
            onClick={() => setUploadDialogOpen(true)}
            sx={{ borderRadius: 100, px: 3, color: 'white', fontWeight: 800 }}
          >
            Upload Moment
          </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress size={32} />
        </Box>
      ) : images.length === 0 ? (
        <Paper elevation={0} sx={{ p: 10, textAlign: 'center', borderRadius: 4, bgcolor: alpha(theme.palette.text.primary, 0.02), border: `2px dashed ${theme.palette.divider}` }}>
          <ImageIcon size={48} color={theme.palette.text.disabled} style={{ marginBottom: 16 }} />
          <Typography variant="h6" color="text.secondary">No moments captured yet.</Typography>
          <Typography variant="body2" color="text.disabled">Be the first to share a moment from the service.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {images.map((img) => (
            <Grid key={img.id} xs={12} sm={6} md={4} lg={3}>
              <Card 
                elevation={0} 
                onClick={() => setViewingImage(img)}
                sx={{ 
                  borderRadius: 3, 
                  border: `1px solid ${theme.palette.divider}`,
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                  '&:hover': { transform: 'translateY(-4px)' }
                }}
              >
                <CardMedia
                  component="img"
                  height="240"
                  image={img.url}
                  alt={img.description}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="body2" fontWeight={700} noWrap sx={{ mb: 0.5 }}>
                    {img.description || "Service Moment"}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Calendar size={12} color={theme.palette.text.disabled} />
                    <Typography variant="caption" color="text.secondary">
                      {format(safeParseDate(img.service_date), 'MMM dd, yyyy')}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Upload Dialog */}
      <Dialog 
        open={uploadDialogOpen} 
        onClose={() => !uploading && setUploadDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4 } } }}
      >
        <Box sx={{ p: 4 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight={900}>Share a Moment</Typography>
            {!uploading && <IconButton onClick={() => setUploadDialogOpen(false)}><X size={24} /></IconButton>}
          </Stack>

          <Box 
            sx={{ 
              width: '100%', 
              height: 240, 
              bgcolor: alpha(theme.palette.text.primary, 0.03), 
              borderRadius: 3, 
              border: `2px dashed ${newImage.preview ? theme.palette.primary.main : theme.palette.divider}`,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              mb: 4
            }}
          >
            {newImage.preview ? (
              <>
                <img src={newImage.preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <IconButton 
                  onClick={() => setNewImage({ ...newImage, file: null, preview: '' })}
                  sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
                >
                  <X size={18} />
                </IconButton>
              </>
            ) : (
              <Stack sx={{ alignItems: 'center' }}>
                <Button 
                  component="label" 
                  variant="text" 
                  startIcon={<Camera size={24} />}
                  sx={{ mb: 1 }}
                >
                  Capture or Select
                  <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                </Button>
                <Typography variant="caption" color="text.disabled">Supports PNG, JPG (Max 5MB)</Typography>
              </Stack>
            )}
          </Box>

          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Description / Caption"
              placeholder="e.g. Sunday Worship, Youth Choir..."
              value={newImage.description}
              onChange={(e) => setNewImage({ ...newImage, description: e.target.value })}
            />
            <TextField
              fullWidth
              type="date"
              label="Service Date"
              value={newImage.service_date}
              onChange={(e) => setNewImage({ ...newImage, service_date: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Button 
              fullWidth 
              variant="contained" 
              size="large"
              disabled={!newImage.file || uploading}
              onClick={handleUpload}
              startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <Upload size={18} />}
              sx={{ py: 1.5, fontWeight: 700 }}
            >
              {uploading ? "Saving Moment..." : "Post to Gallery"}
            </Button>
          </Stack>
        </Box>
      </Dialog>

      {/* Viewing Dialog */}
      <Dialog 
        open={!!viewingImage} 
        onClose={() => setViewingImage(null)} 
        maxWidth="md" 
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 0, bgcolor: 'transparent', boxShadow: 'none' } } }}
      >
        {viewingImage && (
          <Box sx={{ position: 'relative' }}>
            <Box sx={{ bgcolor: 'background.paper', borderRadius: 4, overflow: 'hidden' }}>
              <Box sx={{ position: 'relative', width: '100%', maxHeight: '70vh' }}>
                <img src={viewingImage.url} alt={viewingImage.description} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                <IconButton 
                  onClick={() => setViewingImage(null)}
                  sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
                >
                  <X size={20} />
                </IconButton>
              </Box>
              <Box sx={{ p: 4 }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" fontWeight={800} gutterBottom>
                      {viewingImage.description || "Service Moment"}
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Calendar size={14} color={theme.palette.text.disabled} />
                        <Typography variant="caption" color="text.secondary">
                          {format(safeParseDate(viewingImage.service_date), 'MMMM dd, yyyy')}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                  {canManage && (
                    <Tooltip title="Remove Moment">
                      <IconButton color="error" onClick={() => handleDelete(viewingImage.id, viewingImage.url)}>
                        <Trash2 size={20} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </Box>
            </Box>
          </Box>
        )}
      </Dialog>
    </Box>
  );
};

export default Gallery;
