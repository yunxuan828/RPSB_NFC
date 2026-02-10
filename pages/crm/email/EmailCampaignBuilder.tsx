import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, EmailTemplate, CustomerTag, Customer } from '../../../services/api';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '../../../components/UI';
import { ArrowLeft, Users, Check } from 'lucide-react';

export default function EmailCampaignBuilder() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [tags, setTags] = useState<CustomerTag[]>([]);
  
  const [form, setForm] = useState({
    name: '',
    template_id: '',
    status: [] as string[],
    tags: [] as string[],
    search: ''
  });

  const [preview, setPreview] = useState<{ count: number, sample: Customer[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [tRes, tagRes] = await Promise.all([
        api.listEmailTemplates(),
        api.listTags()
    ]);
    // Filter only draft templates or all? Requirement says "only draft templates allowed for new campaigns; or allow locked but must duplicate first".
    // "select template (only draft templates allowed...)"
    // Let's allow all but warn? Or just filter drafts? 
    // Requirement "select template (only draft templates allowed for new campaigns)" - Strict.
    // I'll filter for draft.
    setTemplates(tRes.data.filter(t => t.status === 'draft'));
    setTags(tagRes);
  };

  const handlePreview = async () => {
    setLoading(true);
    try {
        const criteria = {
            status: form.status.length > 0 ? form.status : undefined,
            tags: form.tags.length > 0 ? form.tags : undefined,
            search: form.search || undefined
        };
        const res = await api.previewEmailCampaign(criteria);
        setPreview(res);
    } catch(e) {
        alert("Error generating preview");
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.name || !form.template_id) {
        alert("Please fill in name and select a template");
        return;
    }
    setLoading(true);
    try {
        const criteria = {
            status: form.status.length > 0 ? form.status : undefined,
            tags: form.tags.length > 0 ? form.tags : undefined,
            search: form.search || undefined
        };
        const res = await api.createEmailCampaign({
            name: form.name,
            template_id: form.template_id,
            audience_snapshot: criteria
        });
        navigate(`/crm/email/campaigns/${res.id}`);
    } catch (e) {
        alert("Error creating campaign");
    }
    setLoading(false);
  };

  const toggleStatus = (s: string) => {
    setForm(prev => ({
        ...prev,
        status: prev.status.includes(s) ? prev.status.filter(x => x !== s) : [...prev.status, s]
    }));
  };

  const toggleTag = (id: string) => {
    setForm(prev => ({
        ...prev,
        tags: prev.tags.includes(id) ? prev.tags.filter(x => x !== id) : [...prev.tags, id]
    }));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/crm/email/campaigns')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold">New Campaign</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle>1. Campaign Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Campaign Name</label>
                        <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Feb Newsletter" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Select Template (Drafts Only)</label>
                        <select 
                            className="w-full p-2 border rounded-md"
                            value={form.template_id}
                            onChange={e => setForm({...form, template_id: e.target.value})}
                        >
                            <option value="">Select a template...</option>
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.name} ({t.template_code})</option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-1">Only draft templates can be used. Locked templates must be duplicated first.</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>2. Audience Selection</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Customer Status</label>
                        <div className="flex flex-wrap gap-2">
                            {['lead', 'active', 'silent', 'inactive'].map(s => (
                                <button 
                                    key={s}
                                    onClick={() => toggleStatus(s)}
                                    className={`px-3 py-1 rounded-full text-sm border capitalize ${form.status.includes(s) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Tags</label>
                        <div className="flex flex-wrap gap-2">
                            {tags.map(t => (
                                <button 
                                    key={t.id}
                                    onClick={() => toggleTag(t.id)}
                                    className={`px-3 py-1 rounded-full text-sm border ${form.tags.includes(t.id) ? 'ring-2 ring-slate-900' : ''}`}
                                    style={{ backgroundColor: t.color || '#eee', color: '#333' }}
                                >
                                    {t.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Search Query (Optional)</label>
                        <Input 
                            value={form.search} 
                            onChange={e => setForm({...form, search: e.target.value})} 
                            placeholder="Name, email or company..." 
                        />
                    </div>
                    
                    <Button onClick={handlePreview} disabled={loading} className="w-full">
                        Update Preview
                    </Button>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
            <Card className="h-full">
                <CardHeader><CardTitle>Preview Audience</CardTitle></CardHeader>
                <CardContent>
                    {preview ? (
                        <div className="space-y-4">
                            <div className="text-center py-4 bg-slate-50 rounded-lg">
                                <div className="text-3xl font-bold text-slate-900">{preview.count}</div>
                                <div className="text-sm text-slate-500">Recipients Found</div>
                            </div>
                            
                            <div>
                                <h4 className="font-medium text-sm mb-2">Sample Recipients (Max 20)</h4>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                    {preview.sample.map(c => (
                                        <div key={c.id} className="text-sm p-2 border rounded hover:bg-slate-50">
                                            <div className="font-medium">{c.full_name}</div>
                                            <div className="text-slate-500 text-xs">{c.email}</div>
                                        </div>
                                    ))}
                                    {preview.sample.length === 0 && <div className="text-sm text-slate-500 italic">No recipients match criteria.</div>}
                                </div>
                            </div>

                            <Button onClick={handleCreate} disabled={loading || preview.count === 0} className="w-full" size="lg">
                                <Check className="h-4 w-4 mr-2" /> Create Campaign
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            Configure audience and click "Update Preview"
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
