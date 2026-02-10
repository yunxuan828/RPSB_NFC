import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, EmailTemplate } from '../../../services/api';
import { Button, Input, Card, CardContent } from '../../../components/UI';
import { ArrowLeft, Save, Copy, User, Mail, Building2 } from 'lucide-react';

// Helpers: plain text <-> simple HTML (so non-technical users never see HTML)
function htmlToPlain(html: string): string {
  if (!html) return '';
  return html
    .replace(/<p\s*[^>]*>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function plainToHtml(plain: string): string {
  if (!plain) return '';
  return plain
    .split(/\n\n+/)
    .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

const MERGE_FIELDS: { label: string; value: string; icon: React.ElementType }[] = [
  { label: 'Customer name', value: '{{customer.full_name}}', icon: User },
  { label: 'Email', value: '{{customer.email}}', icon: Mail },
  { label: 'Company', value: '{{customer.customer_company_name}}', icon: Building2 },
];

const STARTER_TEMPLATES: { name: string; subject: string; body: string }[] = [
  {
    name: 'Welcome email',
    subject: 'Hello {{customer.full_name}}, welcome!',
    body: 'Hi there,\n\nThank you for connecting with us. We\'re glad to have you on board.\n\nIf you have any questions, just reply to this email.\n\nBest regards,\nThe Team',
  },
  {
    name: 'Follow-up',
    subject: 'Quick follow-up – {{customer.customer_company_name}}',
    body: 'Hi {{customer.full_name}},\n\nI wanted to follow up on our recent conversation. Please let me know if you have any updates or questions.\n\nBest regards',
  },
  {
    name: 'Newsletter',
    subject: 'Monthly update for {{customer.full_name}}',
    body: 'Hello,\n\nHere’s your monthly update with the latest news and offers.\n\nWe hope you find it useful.\n\nBest regards,\nThe Team',
  },
];

function insertAtCursor(el: HTMLInputElement | HTMLTextAreaElement | null, text: string): void {
  if (!el) return;
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  const value = el.value;
  const newValue = value.slice(0, start) + text + value.slice(end);
  if ('value' in el) el.value = newValue;
  el.setSelectionRange(start + text.length, start + text.length);
  el.focus();
}

export default function EmailTemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [template, setTemplate] = useState<Partial<EmailTemplate>>({
    name: '',
    subject: '',
    body_html: '',
  });
  const [bodyPlain, setBodyPlain] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadTemplate(id);
    }
  }, [id]);

  const loadTemplate = async (templateId: string) => {
    const data = await api.getEmailTemplate(templateId);
    setTemplate(data);
    setBodyPlain(htmlToPlain(data.body_html || ''));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        ...template,
        body_html: plainToHtml(bodyPlain) || template.body_html,
      };
      if (id) {
        await api.updateEmailTemplate(id, payload);
      } else {
        await api.createEmailTemplate(payload);
      }
      navigate('/crm/email/templates');
    } catch (e) {
      alert('Error saving template');
    }
    setLoading(false);
  };

  const handleDuplicate = async () => {
    if (!id) return;
    if (confirm('Duplicate this template to edit a copy?')) {
      const newTemp = await api.duplicateEmailTemplate(id);
      navigate(`/crm/email/templates/${newTemp.id}`);
    }
  };

  const applyStarter = (t: (typeof STARTER_TEMPLATES)[0]) => {
    setTemplate((prev) => ({
      ...prev,
      name: t.name,
      subject: t.subject,
    }));
    setBodyPlain(t.body);
  };

  const insertIntoSubject = (value: string) => {
    insertAtCursor(subjectRef.current, value);
    setTemplate((prev) => ({ ...prev, subject: subjectRef.current?.value ?? prev.subject }));
  };

  const insertIntoBody = (value: string) => {
    insertAtCursor(bodyRef.current, value);
    setBodyPlain(bodyRef.current?.value ?? bodyPlain);
  };

  const isLocked = template.status === 'locked';
  const isNew = !id;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/crm/email/templates')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold flex-1">
          {id ? (isLocked ? 'View Template' : 'Edit Template') : 'New Template'}
        </h1>
        {isLocked && (
          <Button onClick={handleDuplicate}>
            <Copy className="h-4 w-4 mr-2" /> Duplicate to Edit
          </Button>
        )}
        {!isLocked && (
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" /> Save
          </Button>
        )}
      </div>

      {isLocked && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 text-amber-700">
          This template is locked because it has been used in a campaign. Duplicate it to make changes.
        </div>
      )}

      {isNew && (
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-slate-700 mb-2">Start from a ready-made template (optional)</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setTemplate((p) => ({ ...p, name: '', subject: '', body_html: '' }));
                  setBodyPlain('');
                }}
              >
                Blank
              </Button>
              {STARTER_TEMPLATES.map((t) => (
                <Button key={t.name} type="button" variant="outline" size="sm" onClick={() => applyStarter(t)}>
                  {t.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-6 pt-6">
          <div>
            <label className="block text-sm font-medium mb-1">Template name</label>
            <Input
              value={template.name || ''}
              onChange={(e) => setTemplate({ ...template, name: e.target.value })}
              disabled={isLocked}
              placeholder="e.g. Welcome email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email subject</label>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs text-slate-500">Insert:</span>
              {MERGE_FIELDS.map(({ label, value, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => insertIntoSubject(value)}
                  disabled={isLocked}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-slate-200 text-xs hover:bg-slate-50"
                >
                  <Icon className="h-3 w-3" /> {label}
                </button>
              ))}
            </div>
            <Input
              ref={subjectRef}
              value={template.subject || ''}
              onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
              disabled={isLocked}
              placeholder="e.g. Hello! Welcome to our service"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs text-slate-500">Insert:</span>
              {MERGE_FIELDS.map(({ label, value, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => insertIntoBody(value)}
                  disabled={isLocked}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-slate-200 text-xs hover:bg-slate-50"
                >
                  <Icon className="h-3 w-3" /> {label}
                </button>
              ))}
            </div>
            <textarea
              ref={bodyRef}
              className="w-full h-72 p-3 border rounded-md text-sm bg-white resize-y"
              value={bodyPlain}
              onChange={(e) => setBodyPlain(e.target.value)}
              disabled={isLocked}
              placeholder="Write your message here. Use the buttons above to add the customer's name, email, or company."
            />
            <p className="text-xs text-slate-500 mt-1">
              Write in plain text. Each paragraph will be formatted automatically in the email.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
