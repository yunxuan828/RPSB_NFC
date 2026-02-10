import React, { useState, useEffect } from 'react';
import { api, EmailTemplate } from '../../../services/api';
import { Button, Card, CardHeader, CardTitle, CardContent } from '../../../components/UI';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Copy, FileText, Lock } from 'lucide-react';

export default function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const res = await api.listEmailTemplates();
    setTemplates(res.data);
  };

  const handleDuplicate = async (id: string) => {
    if (confirm('Duplicate this template?')) {
      await api.duplicateEmailTemplate(id);
      loadTemplates();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Email Templates</h1>
        <Link to="/crm/email/templates/new">
          <Button><Plus className="h-4 w-4 mr-2" /> New Template</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map(t => (
          <Card key={t.id} className="cursor-pointer hover:border-slate-400 transition-colors" onClick={() => navigate(`/crm/email/templates/${t.id}`)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.template_code}</CardTitle>
              {t.status === 'locked' ? <Lock className="h-4 w-4 text-slate-400" /> : <FileText className="h-4 w-4 text-green-500" />}
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold mb-2">{t.name}</div>
              <p className="text-xs text-slate-500 mb-4 truncate">{t.subject}</p>
              <div className="flex justify-between items-center">
                 <span className="text-xs text-slate-400">{new Date(t.created_at).toLocaleDateString()}</span>
                 <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDuplicate(t.id); }}>
                   <Copy className="h-4 w-4" />
                 </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
