import '@mui/material/Typography';
import '@mui/material/Grid';
import '@mui/material/Button';
import '@mui/material/Box';

declare module '@mui/material/Typography' {
  interface TypographyOwnProps {
    fontWeight?: any;
    component?: any;
  }
}

declare module '@mui/material/Grid' {
  interface GridOwnProps {
    component?: any;
  }
}

declare module '@mui/material/Button' {
  interface ButtonOwnProps {
    component?: any;
  }
}

declare module '@mui/material/Box' {
  interface BoxOwnProps {
    component?: any;
  }
}
