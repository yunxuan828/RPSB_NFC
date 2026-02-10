import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, EmailCampaign, EmailCampaignRecipient } from '../../../services/api';
import { Button, Card, CardHeader, CardTitle, CardContent } from '../../../components/UI';
import { ArrowLeft, Send, RefreshCw } from 'lucide-react';

export default function EmailCampaignDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<EmailCampaign | null>(null);
  const [recipients, setRecipients] = useState<EmailCampaignRecipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [recipientStatus, setRecipientStatus] = useState<string>(''); // '' = all
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    if (id) {
      loadCampaign();
      loadRecipients();
    }
  }, [id, recipientStatus, page]);

  // Poll for updates if sending
  useEffect(() => {
    if (campaign?.status === 'sending' || campaign?.status === 'queued') {
      const interval = setInterval(() => {
        loadCampaign();
        // optionally refresh recipients too if looking at recent list
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [campaign?.status]);

  const loadCampaign = async () => {
    if (!id) return;
    const data = await api.getEmailCampaign(id);
    setCampaign(data);
  };

  const loadRecipients = async () => {
    if (!id) return;
    const res = await api.getEmailCampaignRecipients(id, recipientStatus, page);
    setRecipients(res.data);
    setLastPage(res.last_page);
  };

  const handleSend = async () => {
    if (!id || !campaign) return;
    if (!confirm(`Are you sure you want to send this campaign to ${campaign.totals?.target} recipients? This will lock the template.`)) return;
    
    setLoading(true);
    try {
        await api.sendEmailCampaign(id);
        loadCampaign();
    } catch (e) {
        alert("Error sending campaign");
    }
    setLoading(false);
  };

  if (!campaign) return <div>Loading...</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/crm/email/campaigns')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold flex-1">{campaign.name}</h1>
        {campaign.status === 'draft' && (
            <Button onClick={handleSend} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                <Send className="h-4 w-4 mr-2" /> Send Campaign
            </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-sm font-medium text-slate-500">Status</div>
                        <div className="font-bold capitalize">{campaign.status}</div>
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-500">Template</div>
                        <div className="font-bold">{campaign.template?.name}</div>
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-500">Code</div>
                        <div className="font-mono text-sm">{campaign.campaign_code}</div>
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-500">Created</div>
                        <div>{new Date(campaign.created_at).toLocaleDateString()}</div>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>Progress</CardTitle></CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">Target</span>
                        <span className="font-bold">{campaign.totals?.target || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-green-600">
                        <span className="text-sm font-medium">Sent</span>
                        <span className="font-bold">{campaign.totals?.sent || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-red-600">
                        <span className="text-sm font-medium">Failed</span>
                        <span className="font-bold">{campaign.totals?.failed || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                        <span className="text-sm">Skipped</span>
                        <span className="font-bold">{campaign.totals?.skipped || 0}</span>
                    </div>
                    
                    {campaign.status === 'sending' && (
                        <div className="text-xs text-center text-blue-500 animate-pulse">
                            Sending in progress...
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader>
              <div className="flex justify-between items-center">
                  <CardTitle>Recipients</CardTitle>
                  <div className="flex gap-2">
                      <select 
                        className="text-sm border rounded p-1" 
                        value={recipientStatus} 
                        onChange={e => { setRecipientStatus(e.target.value); setPage(1); }}
                      >
                          <option value="">All Statuses</option>
                          <option value="queued">Queued</option>
                          <option value="sent">Sent</option>
                          <option value="failed">Failed</option>
                          <option value="skipped">Skipped</option>
                      </select>
                      <Button variant="ghost" size="sm" onClick={loadRecipients}><RefreshCw className="h-4 w-4" /></Button>
                  </div>
              </div>
          </CardHeader>
          <CardContent>
              <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                      <thead>
                          <tr className="border-b text-left">
                              <th className="py-2">Email</th>
                              <th className="py-2">Name</th>
                              <th className="py-2">Status</th>
                              <th className="py-2">Message/Error</th>
                              <th className="py-2">Sent At</th>
                          </tr>
                      </thead>
                      <tbody>
                          {recipients.map(r => (
                              <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                                  <td className="py-2">{r.email}</td>
                                  <td className="py-2">{r.customer?.full_name || '-'}</td>
                                  <td className="py-2">
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize 
                                          ${r.status === 'sent' ? 'bg-green-100 text-green-700' : 
                                            r.status === 'failed' ? 'bg-red-100 text-red-700' : 
                                            'bg-slate-100 text-slate-700'}`}>
                                          {r.status}
                                      </span>
                                  </td>
                                  <td className="py-2 text-slate-500 max-w-xs truncate" title={r.error_message}>{r.error_message || '-'}</td>
                                  <td className="py-2 text-slate-500">{r.sent_at ? new Date(r.sent_at).toLocaleString() : '-'}</td>
                              </tr>
                          ))}
                          {recipients.length === 0 && (
                              <tr><td colSpan={5} className="text-center py-4 text-slate-500">No recipients found</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
              
              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                  <span className="text-xs text-slate-500">Page {page} of {lastPage}</span>
                  <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
          </CardContent>
      </Card>
    </div>
  );
}
