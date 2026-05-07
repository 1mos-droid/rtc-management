import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { 
  Box, 
  Typography, 
  Grid, 
  Button, 
  useTheme, 
  alpha, 
  Container, 
  Paper,
  Stack,
  CircularProgress
} from '@mui/material';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  FileText,
  Download,
  FileSpreadsheet,
  FileCode
} from 'lucide-react';

import { supabase } from '../supabase';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const Reports = () => {
  const theme = useTheme();
  const { filterData, showNotification } = useWorkspace();
  const [generating, setGenerating] = useState(null);

  const downloadReport = async (type, format) => {
    setGenerating(`${type}-${format}`);
    try {
      const tableName = type === 'members' ? 'members' : type === 'financial' ? 'transactions' : 'attendance';
      const { data: rawData, error } = await supabase.from(tableName).select('*').limit(2000);
      
      if (error) throw error;

      const data = filterData(rawData || []);
      
      if (!data || data.length === 0) {
        showNotification("No data to report.", "warning");
        return;
      }

      const fileName = `RTCI_${type}_${new Date().toISOString().slice(0,10)}`;
      if (format === 'pdf') {
        const doc = new jsPDF();
        doc.text(`${type.toUpperCase()} AUDIT REPORT`, 14, 20);
        doc.autoTable({ head: [Object.keys(data[0])], body: data.map(r => Object.values(r).map(v => String(v))), startY: 30 });
        doc.save(`${fileName}.pdf`);
      } else {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, `${fileName}.xlsx`);
      }
      showNotification("Report generated.");
    } catch (e) { 
        console.error(e);
        showNotification("Failed to generate report.", "error"); 
    }
    finally { setGenerating(null); }
  };

  return (
    <Box sx={{ pb: 10 }}>
      <Box sx={{ mb: 8 }}>
        <Typography variant="overline" color="primary" fontWeight={800} letterSpacing={3}>AUDIT & GOVERNANCE</Typography>
        <Typography variant="h2" sx={{ fontWeight: 900, mt: 1 }}>Executive Reports</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2, maxWidth: 600 }}>
             Formal documentation for ministerial review, financial audits, and organizational planning.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {[
            { id: 'members', title: 'Congregation Registry', icon: Users, color: theme.palette.primary.main },
            { id: 'financial', title: 'Financial Ledger', icon: DollarSign, color: theme.palette.success.main },
            { id: 'attendance', title: 'Service Participation', icon: Calendar, color: theme.palette.warning.main }
        ].map((r) => (
            <Grid size={{ xs: 12, md: 4 }} key={r.id}>
                <Paper elevation={0} sx={{ p: 6, borderRadius: 0, border: `1px solid ${theme.palette.divider}`, height: '100%', textAlign: 'center' }}>
                    <Box sx={{ 
                        width: 80, height: 80, borderRadius: 0, 
                        bgcolor: alpha(r.color, 0.05), color: r.color, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mx: 'auto', mb: 4
                    }}>
                        <r.icon size={32} />
                    </Box>
                    <Typography variant="h5" fontWeight={900} gutterBottom sx={{ fontFamily: 'Merriweather' }}>{r.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 6, fontFamily: 'Lora' }}>Export comprehensive logs for the current environment in standardized formats.</Typography>
                    
                    <Stack spacing={2}>
                        <Button 
                            fullWidth variant="contained" 
                            disabled={!!generating}
                            startIcon={generating === `${r.id}-pdf` ? <CircularProgress size={16} color="inherit" /> : <FileText size={16}/>}
                            onClick={() => downloadReport(r.id, 'pdf')}
                        >
                            PDF Document
                        </Button>
                        <Button 
                            fullWidth variant="outlined" 
                            disabled={!!generating}
                            startIcon={generating === `${r.id}-excel` ? <CircularProgress size={16} /> : <FileSpreadsheet size={16}/>}
                            onClick={() => downloadReport(r.id, 'excel')}
                        >
                            Excel Spreadsheet
                        </Button>
                    </Stack>
                </Paper>
            </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Reports;
