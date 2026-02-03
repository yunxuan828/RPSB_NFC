
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { User, NFCWriteStatus } from '../types';
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Input, Badge
} from '../components/UI';
import { Wifi, Radio, CheckCircle2, AlertCircle, RefreshCw, User as UserIcon, Search, ChevronDown, ChevronUp, Usb } from 'lucide-react';
import { getFullImageUrl } from '../lib/utils';

// Extend Navigator interface for WebUSB support
declare global {
  interface Navigator {
    usb: {
      getDevices: () => Promise<any[]>;
      requestDevice: (options?: { filters: any[] }) => Promise<any>;
    };
  }
}

// ACS Vendor ID (Standard for ACR122U)
const ACR122U_VENDOR_ID = 0x072F;
// Use env var for writer service URL, default to local v2 service
const WRITER_SERVICE_URL = (import.meta as any).env?.VITE_WRITER_SERVICE_URL || 'http://127.0.0.1:8787';

const WriteCard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [status, setStatus] = useState<NFCWriteStatus>({ state: 'idle', message: 'Waiting for inputs.' });
  const [users, setUsers] = useState<User[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Hardware State
  const [isReaderConnected, setIsReaderConnected] = useState(false);
  const [readerName, setReaderName] = useState<string>('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const statusPollRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const data = await api.getUsers();
      setUsers(data);
      setLoadingUsers(false);
    };
    fetchUsers();

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    // Check if device was previously paired (optional, browser dependent)
    if (navigator.usb) {
      navigator.usb.getDevices().then(devices => {
        const acrDevice = devices.find(d => d.vendorId === ACR122U_VENDOR_ID);
        if (acrDevice) {
          setIsReaderConnected(true);
          setReaderName(acrDevice.productName || 'ACR122U Reader');
        }
      });
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Poll local writer service for reader/card status
  useEffect(() => {
    if (!WRITER_SERVICE_URL) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`${WRITER_SERVICE_URL}/status`);
        if (!res.ok) throw new Error('service unavailable');
        const data = await res.json();
        if (cancelled) return;
        setIsReaderConnected(!!data.reader);
        setReaderName(data.reader || 'ACR122U Reader');
        if (!data.cardPresent && status.state === 'scanning') {
          setStatus({ state: 'scanning', message: 'Waiting for card...' });
        }
      } catch (err) {
        if (cancelled) return;
        setIsReaderConnected(false);
        setReaderName('');
      }
    };

    poll();
    const id = window.setInterval(poll, 3000);
    statusPollRef.current = id;
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [status.state]);

  const filteredUsers = users.filter(u =>
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSearchTerm(user.fullName);
    setIsDropdownOpen(false);
    setStatus({ state: 'idle', message: 'User selected. Ready to write.' });
  };

  const handleConnectReader = async () => {
    // For the companion service, just inform the user; service polls reader state.
    if (WRITER_SERVICE_URL) {
      setStatus({ state: 'idle', message: 'Ensure the reader is plugged in and the writer service is running.' });
      return;
    }

    try {
      if (!navigator.usb) {
        alert("WebUSB is not supported in this browser. Please use Chrome, Edge, or Opera.");
        return;
      }

      // Request device with ACS Vendor ID filter
      const device = await navigator.usb.requestDevice({
        filters: [{ vendorId: ACR122U_VENDOR_ID }]
      });

      await device.open();
      // Usually config 1 is standard for these readers
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }
      // Attempt to claim interface (exclusive access)
      await device.claimInterface(0);

      setIsReaderConnected(true);
      setReaderName(device.productName || 'ACR122U Reader');
      setStatus({ state: 'idle', message: 'Reader connected successfully.' });

    } catch (error: any) {
      // Gracefully handle user cancellation or no device selected
      if (error.name === 'NotFoundError' || String(error).includes('No device selected')) {
        console.log('Device selection cancelled by user.');
        setStatus({ state: 'idle', message: 'Device selection cancelled.' });
        return;
      }

      // WebUSB can throw SecurityError when the device is denied or already in use
      if (error.name === 'SecurityError') {
        console.error('WebUSB security error:', error);
        setStatus({ state: 'error', message: 'Access denied by browser/OS. Ensure device is permitted and not in use.' });
        return;
      }

      console.error(error);
      alert(`Connection failed: ${error.message || String(error)}`);
      setIsReaderConnected(false);
    }
  };

  const handleWriteNFC = async () => {
    if (!selectedUser) return;

    setStatus({ state: 'scanning', message: 'Place card on the reader now...' });

    try {
      // Prefer local writer service (PC/SC)
      if (WRITER_SERVICE_URL) {
        const res = await fetch(`${WRITER_SERVICE_URL}/write`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: selectedUser.profileUrl })
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Writer service error');
        }

        await api.incrementCardWriteCount();
        setStatus({ state: 'success', message: `Card successfully encoded: ${selectedUser.profileUrl}` });
        return;
      }

      if ('NDEFReader' in window) {
        // --- WEB NFC API (Modern Standard) ---
        // @ts-ignore
        const ndef = new NDEFReader();
        await ndef.write({
          records: [{ recordType: "url", data: selectedUser.profileUrl }]
        });

        await api.incrementCardWriteCount();
        setStatus({ state: 'success', message: `Successfully wrote URL for ${selectedUser.fullName}` });
      } else {
        // No Web NFC support in this browser. We don't simulate success to avoid false positives.
        setStatus({
          state: 'error',
          message: 'Web NFC is not supported in this browser. Writing did NOT occur. Use Chrome on Android (Web NFC) or a native/Node PC/SC writer for ACR122U.'
        });
      }
    } catch (error) {
      console.error(error);
      setStatus({ state: 'error', message: 'Write failed. Check card position.' });
    }
  };

  const resetProcess = () => {
    setStatus({ state: 'idle', message: 'Ready for next card.' });
    setSearchTerm('');
    setSelectedUser(null);
    setIsDropdownOpen(false);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Write to NFC</h2>
        <p className="text-slate-500">Manage hardware connection and encode employee cards.</p>
      </div>

      <div className="grid gap-6">

        {/* Step 1: Hardware Connection */}
        <Card className={`${isReaderConnected ? 'border-green-200 bg-green-50/30' : 'border-slate-200'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                Hardware Connection
              </div>
              {isReaderConnected ? (
                <Badge className="bg-green-600 hover:bg-green-700">Connected</Badge>
              ) : (
                <Badge variant="outline" className="text-slate-500">Not Connected</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isReaderConnected ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  <Usb className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">{isReaderConnected ? readerName : 'ACR122U Reader'}</p>
                  <p className="text-xs text-slate-500">
                    {isReaderConnected ? 'Device ready for commands.' : 'USB device required.'}
                  </p>
                </div>
              </div>
              {!isReaderConnected && (
                <Button size="sm" onClick={handleConnectReader}>
                  Connect Reader
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Select User */}
        <Card className={`${selectedUser ? 'border-slate-200' : 'border-slate-200'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
              Select Employee
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search employee list..."
                  value={searchTerm}
                  onChange={e => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                    if (selectedUser) setSelectedUser(null);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="pl-9 pr-10"
                />
                <button
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  {isDropdownOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>

              {/* Dropdown List */}
              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {loadingUsers ? (
                    <div className="p-4 text-center text-sm text-slate-500">Loading employees...</div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">No employees found.</div>
                  ) : (
                    <div className="py-1">
                      {filteredUsers.map(user => (
                        <div
                          key={user.id}
                          className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-colors"
                          onClick={() => handleSelectUser(user)}
                        >
                          {user.avatarUrl ? (
                            <img src={getFullImageUrl(user.avatarUrl)} alt="" className="h-8 w-8 rounded-full object-cover border border-slate-100" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-500">
                              <UserIcon className="h-4 w-4" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{user.fullName}</p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                          </div>
                          {user.companyId && (
                            <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">
                              ID: {user.companyId}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedUser && (
              <div className="p-4 bg-slate-50 rounded-lg flex items-start gap-4 border animate-in fade-in duration-300">
                {selectedUser.avatarUrl ? (
                  <img
                    src={getFullImageUrl(selectedUser.avatarUrl)}
                    alt={selectedUser.fullName}
                    className="h-12 w-12 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-white border flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-slate-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900">{selectedUser.fullName}</h4>
                  <p className="text-sm text-slate-500">{selectedUser.jobTitle}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-100 inline-block">
                      {selectedUser.profileUrl}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Write Process */}
        <Card className={`${selectedUser ? 'border-slate-900 ring-1 ring-slate-900 shadow-md' : 'opacity-50 grayscale pointer-events-none'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
              Write Data
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-8 space-y-6">

            {/* Status Indicator Circle */}
            <div className={`
              relative flex items-center justify-center w-32 h-32 rounded-full border-4 transition-all duration-500
              ${status.state === 'idle' ? 'border-slate-200 bg-slate-50' : ''}
              ${status.state === 'scanning' ? 'border-blue-500 bg-blue-50' : ''}
              ${status.state === 'writing' ? 'border-yellow-500 bg-yellow-50' : ''}
              ${status.state === 'success' ? 'border-green-500 bg-green-50' : ''}
              ${status.state === 'error' ? 'border-red-500 bg-red-50' : ''}
            `}>
              {status.state === 'scanning' && <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-ping"></div>}

              {status.state === 'idle' && <Wifi className="h-12 w-12 text-slate-300" />}
              {status.state === 'scanning' && <Radio className="h-12 w-12 text-blue-500" />}
              {status.state === 'writing' && <RefreshCw className="h-12 w-12 text-yellow-500 animate-spin" />}
              {status.state === 'success' && <CheckCircle2 className="h-12 w-12 text-green-500" />}
              {status.state === 'error' && <AlertCircle className="h-12 w-12 text-red-500" />}
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-semibold text-lg">
                {status.state === 'scanning' ? 'Scanning...' :
                  status.state === 'writing' ? 'Writing Data...' :
                    status.state === 'success' ? 'Write Complete' :
                      status.state === 'error' ? 'Write Failed' : 'Ready to Write'}
              </h3>
              <p className="text-sm text-slate-500 max-w-xs">{status.message}</p>
            </div>

            <div className="flex gap-2 w-full max-w-xs">
              {status.state === 'success' ? (
                <Button size="lg" className="w-full" onClick={resetProcess}>
                  Encode Next Card
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="w-full"
                  disabled={!selectedUser || status.state === 'scanning' || status.state === 'writing'}
                  onClick={handleWriteNFC}
                >
                  {status.state === 'scanning' ? 'Detecting Card...' : 'Start Write Process'}
                </Button>
              )}
            </div>

            {!isReaderConnected && status.state !== 'success' && (
              <p className="text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded">
                Note: Reader not connected via WebUSB. Using simulation or Web NFC if available.
              </p>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WriteCard;
