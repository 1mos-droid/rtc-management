import React from 'react';
import { Dialog, Slide, useTheme, useMediaQuery } from '@mui/material';
import MemberDetailsContent from './members/MemberDetailsContent';

const Transition = React.forwardRef(function Transition(props: any, ref: any) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const MemberDetailsDialog = ({ open, onClose, member, onEdit, onDelete }) => {
  const theme = useTheme();
  // We can make it fullscreen on mobile, or just standard Dialog.
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!member) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      slots={{ transition: Transition }}
      fullWidth
      maxWidth="sm"
      fullScreen={isMobile}
      slotProps={{ paper: { sx: { borderRadius: isMobile ? 0 : '24px', overflow: 'hidden', height: isMobile ? '100%' : '80vh' } } }}
    >
      <MemberDetailsContent 
        member={member} 
        onClose={onClose} 
        onEdit={onEdit} 
        onDelete={onDelete} 
      />
    </Dialog>
  );
};

export default MemberDetailsDialog;
