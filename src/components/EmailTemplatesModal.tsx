'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Sparkles } from 'lucide-react';

interface EmailTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Template {
  id: string;
  title: string;
  badge: string;
  subject: string;
  body: string;
}

export default function EmailTemplatesModal({ isOpen, onClose }: EmailTemplatesModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const templates: Template[] = [
    {
      id: 'template-phd-paper',
      title: 'PhD Cold Email (Paper & Lab Specific)',
      badge: 'Best Response Rate',
      subject: 'Prospective PhD Applicant (Fall 2027) - Inquiring on Research Openings in [Lab Name]',
      body: `Dear Professor [Professor Last Name],

I hope this email finds you well.

My name is [My Name], and I am a prospective PhD applicant for the Fall 2027 cycle in [Department Name] at [University Name]. I have been closely following your lab's work on [Research Area], and I was particularly fascinated by your recent paper, "[Paper Title]" published in [Venue/Year]. 

Specifically, your approach to [mention one specific technique, e.g., using multi-agent debate to calibrate uncertainty] inspired my recent work on [mention your own project/experience briefly]. In my undergraduate/master's thesis at [My Current Uni], I [mention 1 key quantitative achievement or publication, e.g., developed a benchmark evaluating LLM tool usage, published at EMNLP 2025].

I am writing to inquire if you anticipate having openings for new PhD students in your group for the Fall 2027 admissions cycle. My research interests align strongly with your group's focus on [1-2 specific research topics].

I have attached my CV and transcript for your reference. My Google Scholar profile is available here: [Scholar URL]. If your schedule permits, I would welcome the opportunity to briefly speak with you or a member of your lab about potential opportunities.

Thank you very much for your time and consideration.

Warm regards,

[My Name]
B.S. / M.S. in Computer Science, [My University]
[Personal Website / Portfolio Link]
[Phone Number]`,
    },
    {
      id: 'template-ms-thesis',
      title: 'Master\'s Thesis / Research Assistant Inquiry',
      badge: 'MS Thesis / HiWi',
      subject: 'Prospective M.S. Thesis Student - Inquiry on Research Opportunities in [Topic]',
      body: `Dear Professor [Professor Last Name],

I hope you are having a productive week.

I am writing to express my strong interest in pursuing research under your supervision as part of the M.S. in [Degree Name] program at [University Name] starting Fall 2027.

I have strong programming and mathematical foundations in [Key Skills, e.g., PyTorch, CUDA, Distributed Systems], and I was thoroughly impressed by your lab's recent contributions to [Topic]. I previously worked on [1-sentence description of relevant project/experience], which yielded [results, e.g., an accepted paper or open-source tool with 500+ stars].

Are you considering prospective Master's students for funded research assistantships (RA) or thesis advising in the upcoming academic year?

I would be grateful for the chance to contribute to your ongoing projects. My CV and research statement are attached.

Thank you for your valuable time.

Sincerely,

[My Name]
[LinkedIn / GitHub / Portfolio]`,
    },
    {
      id: 'template-followup',
      title: 'Gentle 7-Day Follow-Up',
      badge: 'Follow-Up',
      subject: 'Re: Prospective PhD Applicant (Fall 2027) - Inquiring on Research Openings',
      body: `Dear Professor [Professor Last Name],

I hope you are having a wonderful week.

I am following up briefly on my email from last week regarding potential PhD student vacancies in your lab for Fall 2027. I realize how busy the semester is, so I wanted to bring this to the top of your inbox in case it was missed.

I remain very eager about the prospect of contributing to your team's research on [Topic]. Please let me know if you would like any further information or writing samples from my side.

Thank you again for your time and guidance.

Best regards,

[My Name]
[Website / Contact]`,
    },
  ];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'none',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-modal animate-modal"
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="#c084fc" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Cold Outreach Email Templates
              </h3>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Battle-tested outreach templates for Shawon, Imran, and Mahmud. Replace bracketed tags before sending!
            </p>
          </div>
          <button
            onClick={onClose}
            className="xl-icon-btn"
            style={{ width: '28px', height: '28px' }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              style={{
                background: 'rgba(10, 16, 28, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-md)',
                padding: '18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {tpl.title}
                  </span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(192, 132, 252, 0.15)',
                      color: '#c084fc',
                      border: '1px solid rgba(192, 132, 252, 0.3)',
                    }}
                  >
                    {tpl.badge}
                  </span>
                </div>

                <button
                  className="btn btn-secondary"
                  onClick={() => handleCopy(tpl.id, `Subject: ${tpl.subject}\n\n${tpl.body}`)}
                  style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                >
                  {copiedId === tpl.id ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                  <span>{copiedId === tpl.id ? 'Copied!' : 'Copy Template'}</span>
                </button>
              </div>

              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '8px' }}>
                <strong style={{ color: '#cbd5e1' }}>Subject:</strong> {tpl.subject}
              </div>

              <pre
                style={{
                  fontFamily: 'var(--font-main)',
                  fontSize: '0.78rem',
                  color: '#e2e8f0',
                  background: 'rgba(15, 23, 42, 0.8)',
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.5,
                  maxHeight: '220px',
                  overflowY: 'auto',
                }}
              >
                {tpl.body}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
