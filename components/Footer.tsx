import React from 'react';
// import { FeedbackFormDialog } from './feedback-form-dialog'
import { FeedbackBanner } from './feedback-banner';
import Container from './Container';

export default function Footer() {
  return (
    <footer className="w-full h-full">
      <Container>
        <FeedbackBanner />
      </Container>
    </footer>
  );
}
