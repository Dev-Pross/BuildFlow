'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { handleSaveConfig } from './actions';
import { useCredentials } from '@/app/hooks/useCredential';
import { BACKEND_URL } from '@repo/common/zod';

interface GoogleSheetFormClientProps {
  initialData: {
    credentials: Array<{ id: string }>;
    authUrl?: string;
    hasCredentials: boolean;
  };
  userId: string;
  nodeId: string;
}

export function GoogleSheetFormClient(type:{type: string}) {
  const [selectedCredential, setSelectedCredential] = useState<string>('');
  const [documents, setDocuments] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  const [sheets, setSheets] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [operation, setOperation] = useState<string>('read_rows');
  const [range, setRange] = useState<string>('A1:Z100');
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<any>(null);
  const [credId, setCredId] = useState<string>();
  // const [authUrl, setAuthUrl] = useState<string>()
  const userId = ""// get it from redux
  const credType = type.type
 
  const {cred: response, authUrl}  = useCredentials(credType)
  console.log('response from form client', typeof(response))

  console.log(response," response from client after hook")
  console.log(authUrl," authurl")
 

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
      userId,
      // nodeId,
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
      console.log('Success:', res.success);
      console.log('Output:', res.output);
      console.log('Error:', res.error);
      setResult(res);
      if (res.success) {
        toast.success("Configuration saved!");
      } else if (res.error) {
        toast.error(res.error);
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
                <a href={authUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                  + Create new credential
                </a>
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
