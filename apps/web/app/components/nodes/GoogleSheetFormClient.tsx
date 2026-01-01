'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { handleSaveConfig } from './actions';
import { useCredentials } from '@/app/hooks/useCredential';
import { BACKEND_URL } from '@repo/common/zod';
import { useAppSelector } from '@/app/hooks/redux';

interface GoogleSheetFormClientProps {
  type: string;
  nodeType: string;

  position: number;
  initialData?: {
    range?: string;
    operation?: string;
    sheetName?: string;
    spreadSheetId?: string;
    credentialId?: string;
  };
}

export function GoogleSheetFormClient({ type, nodeType, position, initialData }: GoogleSheetFormClientProps) {
  const [selectedCredential, setSelectedCredential] = useState<string>(initialData?.credentialId || '');
  const [documents, setDocuments] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedDocument, setSelectedDocument] = useState<string>(initialData?.spreadSheetId || '');
  const [sheets, setSheets] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>(initialData?.sheetName || '');
  const [operation, setOperation] = useState<string>(initialData?.operation || 'read_rows');
  const [range, setRange] = useState<string>(initialData?.range || 'A1:Z100');
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<any>(null);
  const [credId, setCredId] = useState<string>(initialData?.credentialId || '');
  // const [authUrl, setAuthUrl] = useState<string>()
  console.log('initial data: ', initialData)
  console.log('initial document: ', selectedDocument)
  console.log('initial sheet: ', selectedSheet)
  console.log('initial range: ', range)
  console.log("initial operation: ",operation)

  const userId = useAppSelector(s=>s.user.userId) || ""
  const workflowId = useAppSelector(s=>s.workflow.workflow_id) || ''
  console.log(userId, 'id from client')
  const credType = type
  const nodeTypeParsed = nodeType.split("~")[0] || ""
  console.log('checking nodeType: ', nodeTypeParsed);
  
  const nodeId = nodeType.split("~")[1] || ""
  console.log('checking node id: ',nodeId)
  const {cred: response, authUrl}  = useCredentials(credType)
  console.log('response from form client', typeof(response))

  console.log(response," response from client after hook")
  console.log(authUrl," authurl")

  // Fetch documents when there's initial credentialId
  useEffect(() => {
    const fetchInitialDocuments = async () => {
      if (!initialData?.credentialId) return;
      
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/node/getDocuments/${initialData.credentialId}`, {
          method: 'GET',
          credentials: "include",
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        if (data.files?.length > 0) {
          setDocuments(data.files);
        }
      } catch (error) {
        console.error('Failed to fetch initial documents:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialDocuments();
  }, [initialData?.credentialId]);

  // Fetch sheets when there's initial spreadSheetId
  useEffect(() => {
    const fetchInitialSheets = async () => {
      if (!initialData?.credentialId || !initialData?.spreadSheetId) return;
      
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/node/getSheets/${initialData.credentialId}/${initialData.spreadSheetId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: "include",
        });
        const data = await res.json();
        if (data.files?.data?.length > 0) {
          setSheets(data.files.data);
        }
      } catch (error) {
        console.error('Failed to fetch initial sheets:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialSheets();
  }, [initialData?.credentialId, initialData?.spreadSheetId]);
 
  const openAuthWindow = (url: string) => {
    if (!url) return;
    const width = 520;
    const height = 650;
    const screenLeft = (window as any).screenLeft ?? window.screenX ?? 0;
    const screenTop = (window as any).screenTop ?? window.screenY ?? 0;
    const screenWidth = window.innerWidth ?? document.documentElement.clientWidth ?? screen.width;
    const screenHeight = window.innerHeight ?? document.documentElement.clientHeight ?? screen.height;
    const left = Math.round(screenLeft + (screenWidth - width) / 2);
    const top = Math.round(screenTop + (screenHeight - height) / 2);
    const features = `popup=yes,toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,copyhistory=no,width=${width},height=${height},top=${top},left=${left}`;
    const win = window.open(url, 'google-oauth', features);
    if (!win) {
      window.location.href = url;
      return;
    }
    try { win.focus?.(); } catch {}
  };
  // Fetch documents when credential is selected
  const handleCredentialChange = async (credentialId: string) => {
    setSelectedCredential(credentialId);
    setDocuments([]);
    setSheets([]);
    setSelectedDocument('');
    setSelectedSheet('');
    
    if (!credentialId || credentialId === 'create-new') return;
    setCredId(credentialId)
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/node/getDocuments/${credentialId}`, {
        method: 'GET',
        credentials:"include",
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
     
      if (data.files.length >0) {
        setDocuments(data.files || []);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sheet tabs when document is selected
  const handleDocumentChange = async (documentId: string) => {
    setSelectedDocument(documentId);
    setSheets([]);
    setSelectedSheet('');
    
    if (!documentId) return;

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/node/getSheets/${credId}/${documentId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials:"include",
      });
      const data = await response.json();
      //  console.log(data," from clint")
      if (data.files.data.length > 0) {
        setSheets(data.files.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch sheet tabs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClick = () => {
    const config = {
      userId:userId,
      node_Trigger:nodeId,
      workflowId,
      type:nodeTypeParsed,
      position: position,
      name: `Google sheet - ${nodeTypeParsed}`,
      credentialId: selectedCredential,
      spreadsheetId: selectedDocument,
      sheetName: selectedSheet,
      operation,
      range
    };

    startTransition(async () => {
      console.log('Sending config:', config);
      const res = await handleSaveConfig(config);
      console.log('Full response:', res);
      // console.log('Success:', res.success);
      // console.log('Output:', res.output);
      // console.log('Error:', res.error);
      // setResult(res);
      if (res.success) {
        toast.success("Configuration saved!");
      } else {
        toast.error(res.data);
      }
    });
  }

  return (
    <div className="space-y-4 p-4">
      {/* 1. Credentials Select */}
      <div>
        <Label htmlFor="credential">Credential to connect with</Label>
        <Select value={selectedCredential} onValueChange={handleCredentialChange}>
          <SelectTrigger className="w-full mt-2">
            <SelectValue placeholder="Select credential" />
          </SelectTrigger>
          <SelectContent>
            {authUrl ? (
              // <SelectItem value="create-new">
                <div onClick={()=>{openAuthWindow(authUrl)}} className="text-blue-500 cursor-default">
                  + Create new credential
                </div>
              // </SelectItem>
            ) : (
              <>
                {
                response?.map((cred: any) => (
                  <SelectItem key={cred.id} value={cred.id}>
                    Google Account ({cred.id.slice(0, 8)}...)
                  </SelectItem>
                ))
                }
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* 2. Documents (Sheets from Drive) */}
      <div>
        <Label htmlFor="document">Document (Spreadsheet)</Label>
        <Select 
          value={selectedDocument} 
          onValueChange={handleDocumentChange}
          disabled={!selectedCredential || selectedCredential === 'create-new'}
        >
          <SelectTrigger className="w-full mt-2">
            <SelectValue placeholder={loading ? "Loading..." : "Select spreadsheet"} />
          </SelectTrigger>
          <SelectContent>
            {documents.length === 0 ? (
              <SelectItem value="none" disabled>No spreadsheets found</SelectItem>
            ) : (
              documents.map((doc) => (
                <SelectItem key={doc.id} value={doc.id}>
                  {doc.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* 3. Sheets from selected document */}
      <div>
        <Label htmlFor="sheet">Sheet</Label>
        <Select 
          value={selectedSheet} 
          onValueChange={setSelectedSheet}
          disabled={!selectedDocument}
        >
          <SelectTrigger className="w-full mt-2">
            <SelectValue placeholder={loading ? "Loading..." : "Select sheet"} />
          </SelectTrigger>
          <SelectContent>
            {sheets.length === 0 ? (
              <SelectItem value="none" disabled>No sheets found</SelectItem>
            ) : (
              sheets.map((sheet) => (
                <SelectItem key={sheet.id} value={sheet.name || ''}>
                  {sheet.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* 4. Operation */}
      <div>
        <Label htmlFor="operation">Operation</Label>
        <Select value={operation} onValueChange={setOperation}>
          <SelectTrigger className="w-full mt-2">
            <SelectValue placeholder="Select operation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="read_rows">Read Rows</SelectItem>
            {/* Add more operations as you implement them */}
            <SelectItem value="write_rows" disabled>Write Rows (Coming soon)</SelectItem>
            <SelectItem value="update_rows" disabled>Update Rows (Coming soon)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 5. Range for operation */}
      <div>
        <Label htmlFor="range">Range</Label>
        <Input
          id="range"
          type="text"
          value={range}
          onChange={(e) => setRange(e.target.value)}
          placeholder="e.g., A1:Z100 or Sheet1!A1:B10"
          className="mt-2"
          disabled={!selectedSheet}
        />
        <p className="text-xs text-gray-500 mt-1">
          Specify the range in A1 notation (e.g., A1:Z100)
        </p>
      </div>

      {/* Submit/Save Button */}
      <div className="pt-4">
        {/* <Button 
          className="w-full"
          disabled={!selectedCredential || !selectedDocument || !selectedSheet || !range}
          onClick={() => {
            const config = {
              credentialId: selectedCredential,
              spreadsheetId: selectedDocument,
              sheetName: selectedSheet,
              operation,
              range
            };
            console.log('Form config:', config);
            // Here you would save this config to your database
            alert('Configuration saved! (Check console for details)');
          }}
        >
          Save Configuration
        </Button> */}

        <Button
        className="w-full"
        disabled={!selectedCredential || !selectedDocument || !selectedSheet || !range || isPending}
        onClick={handleSaveClick}
      >
        {isPending ? 'Saving…' : 'Save Configuration'}
      </Button>
      {result?.success === false && <p className="text-red-500 text-sm">{result.error}</p>}
      {result?.authUrl && (
        <a className="text-blue-500 text-sm" href={result.authUrl} target="_blank" rel="noreferrer">
          Connect Google
        </a>
      )}
      </div>
    </div>
  );
}
