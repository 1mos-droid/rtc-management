import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { 
  Box, 
  Typography, 
  Grid, 
  Button, 
  useTheme, 
  alpha, 
  Paper,
  Stack,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  FileText,
  FileSpreadsheet
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
        showNotification("No data available for reporting in this scope.", "warning");
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
      showNotification("Report generated and downloaded.");
    } catch (e) { 
        console.error(e);
        showNotification("Failed to generate report.", "error"); 
    } finally { setGenerating(null); }
  };

  const reportTypes = [
    { id: 'members', title: 'Member Registry', description: 'Comprehensive list of all registered congregation members and their details.', icon: Users, color: theme.palette.primary.main },
    { id: 'financial', title: 'Financial Ledger', description: 'Audit-ready logs of all contributions and ministerial expenditures.', icon: DollarSign, color: theme.palette.success.main },
    { id: 'attendance', title: 'Attendance Logs', description: 'Historical data of service participation and congregation growth.', icon: Calendar, color: theme.palette.info.main }
  ];

  return (
    <Box>
      <Box sx={{ mb: 6 }}>
        <Typography variant="h2">Audit Reports</Typography>
        <Typography variant="body1" color="text.secondary">Formal documentation for ministerial review and organizational planning.</Typography>
      </Box>

      <Grid container spacing={4}>
        {reportTypes.map((r) => (
            <Grid item xs={12} md={4} key={r.id}>
                <Card elevation={0} sx={{ height: '100%', border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                    <CardContent sx={{ p: 4, textAlign: 'center' }}>
                        <Box sx={{ 
                            width: 64, height: 64, borderRadius: 2, 
                            bgcolor: alpha(r.color, 0.08), color: r.color, 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            mx: 'auto', mb: 3
                        }}>
                            <r.icon size={28} />
                        </Box>
                        <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>{r.title}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 4, minHeight: 60 }}>
                            {r.description}
                        </Typography>
                        
                        <Stack spacing={2}>
                            <Button 
                                fullWidth variant="contained" 
                                size="small"
                                disabled={!!generating}
                                startIcon={generating === `${r.id}-pdf` ? <CircularProgress size={16} color="inherit" /> : <FileText size={16}/>}
                                onClick={() => downloadReport(r.id, 'pdf')}
                            >
                                Download PDF
                            </Button>
                            <Button 
                                fullWidth variant="outlined" 
                                size="small"
                                disabled={!!generating}
                                startIcon={generating === `${r.id}-excel` ? <CircularProgress size={16} /> : <FileSpreadsheet size={16}/>}
                                onClick={() => downloadReport(r.id, 'excel')}
                            >
                                Download Excel
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Reports;
