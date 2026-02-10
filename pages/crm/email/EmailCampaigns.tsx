import React, { useState, useEffect } from 'react';
import { api, EmailCampaign } from '../../../services/api';
import { Button, Card, CardContent } from '../../../components/UI';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

export default function EmailCampaigns() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    const res = await api.listEmailCampaigns();
    setCampaigns(res.data);
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'draft': return 'bg-slate-100 text-slate-700';
          case 'queued': return 'bg-yellow-100 text-yellow-700';
          case 'sending': return 'bg-blue-100 text-blue-700';
          case 'completed': return 'bg-green-100 text-green-700';
          case 'failed': return 'bg-red-100 text-red-700';
          default: return 'bg-slate-100';
      }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Email Campaigns</h1>
        <Link to="/crm/email/campaigns/new">
          <Button><Plus className="h-4 w-4 mr-2" /> New Campaign</Button>
        </Link>
      </div>

      <div className="space-y-4">
        {campaigns.map(c => (
          <Card key={c.id} className="cursor-pointer hover:border-slate-400 transition-colors" onClick={() => navigate(`/crm/email/campaigns/${c.id}`)}>
            <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg">{c.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(c.status)} uppercase font-bold`}>{c.status}</span>
                    </div>
                    <div className="text-sm text-slate-500">
                        Code: {c.campaign_code} | Template: {c.template?.name}
                    </div>
                </div>
                
                <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                        <div className="font-bold text-lg">{c.totals?.target || 0}</div>
                        <div className="text-slate-500 text-xs uppercase">Target</div>
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-lg text-green-600">{c.totals?.sent || 0}</div>
                        <div className="text-slate-500 text-xs uppercase">Sent</div>
                    </div>
                    {(c.totals?.failed || 0) > 0 && (
                        <div className="text-center">
                            <div className="font-bold text-lg text-red-600">{c.totals?.failed}</div>
                            <div className="text-slate-500 text-xs uppercase">Failed</div>
                        </div>
                    )}
                </div>
            </CardContent>
          </Card>
        ))}
        {campaigns.length === 0 && (
            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                No campaigns found. Create one to get started.
            </div>
        )}
      </div>
    </div>
  );
}
