// Synthetic interface fixture, served only by tests/inbox-ui.mjs.
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../src/App';
import Inbox from '../src/admin/Inbox';
import '../src/admin/Admin.css';
createRoot(document.getElementById('root')!).render(<Inbox/>);
