import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network/standalone';
import { Network as NetworkIcon, RefreshCw, X, User, FileText, AlertTriangle, ShieldCheck, DollarSign, MapPin, Scale, ArrowRight } from 'lucide-react';

interface NetworkNode {
  id: string;
  label: string;
  type: 'person' | 'case';
  group: 'gang' | 'accused' | 'case';
  score?: number;
  details?: string;
}

interface NetworkEdge {
  from: string;
  to: string;
  label: string;
  color?: { color: string };
  dashes?: boolean;
}

interface NetworkGraphProps {
  data: {
    nodes: NetworkNode[];
    edges: NetworkEdge[];
  };
  onNodeSelect?: (nodeId: string, type: 'person' | 'case') => void;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ data, onNodeSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<any>(null);
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<any | null>(null);

  const getComprehensiveNodeData = (node: NetworkNode) => {
    const isPerson = node.type === 'person';
    const isJacky = node.label.toLowerCase().includes('jacky') || node.label.toLowerCase().includes('jagadish');
    const isRamesh = node.label.toLowerCase().includes('ramesh');
    const isSharief = node.label.toLowerCase().includes('sharief');

    if (isPerson) {
      return {
        id: node.id,
        label: node.label,
        type: 'person',
        category: 'Accused Suspect / Syndicate Member',
        age: isJacky ? 42 : (isRamesh ? 48 : 38),
        gender: 'Male',
        threatScore: node.score ? Math.round(node.score * 100) : (isJacky ? 89 : (isRamesh ? 75 : 84.5)),
        threatLevel: (node.score && node.score >= 0.8) || isJacky || isSharief ? 'CRITICAL' : 'HIGH',
        gang: isRamesh ? 'Independent Syndicate' : 'Sharief Cyber & Hawala Syndicate',
        occupation: isJacky ? 'Absconding Operative' : (isRamesh ? 'Money Mule Coordinator' : 'Syndicate Leader / Real Estate Broker'),
        address: isJacky ? 'Kodagu Forest Hideout / Koramangala' : (isRamesh ? 'Jayanagar 4th Block, Bengaluru' : 'Flat 402, Royal Palms, Koramangala 5th Block, Bengaluru'),
        policeStation: 'Bengaluru City Central PS',
        warrantStatus: 'Active Non-Bailable Warrant (Section 154 Cr.P.C.)',
        priorConvictions: isJacky ? 4 : (isRamesh ? 1 : 3),
        totalHawalaVolume: isJacky ? 'INR 28,00,000' : (isRamesh ? 'INR 12,00,000' : 'INR 45,00,000'),
        linkedCases: ['FIR-2026-004', 'FIR-2026-012', 'FIR-2025-882'],
        coAccused: isJacky ? ['Mohammad Sharief'] : (isRamesh ? ['Mohammad Sharief'] : ['Jagadish @ Jacky', 'Ramesh Gowda']),
        details: node.details || 'Primary suspect flagged by CCTNS intelligence registry.'
      };
    } else {
      // Case FIR Node
      const isFir004 = node.label.includes('004');
      return {
        id: node.id,
        label: node.label,
        type: 'case',
        category: 'CCTNS Registered Crime Dossier',
        registrationDate: '2026-07-24',
        crimeType: isFir004 ? 'Financial Cyber Fraud' : 'Cyber Crime & Hawala Channel',
        bnsSection: isFir004 ? 'BNS 318(4) & IT Act Sec 66D' : 'IT Act Sec 66C / BNS 319',
        district: 'Bengaluru City',
        policeStation: 'Bengaluru City Central PS',
        complainant: 'State of Karnataka / Vikram K. (42 Yrs)',
        investigatingOfficer: 'SI Meera Nair (Badge: INV-1001)',
        primaryAccused: ['Mohammad Sharief', 'Jagadish @ Jacky'],
        stolenAmount: isFir004 ? 'Rs. 50,00,000 (50 Lakhs)' : 'Rs. 15,00,000 (15 Lakhs)',
        status: 'Under Active Investigation / Charge Sheet Drafted',
        evidenceVault: ['Hawala Ledger Scan (Kannada)', 'UPI Transaction Logs', 'Audio Intercept #402'],
        details: node.details || 'Financial fraud involving multi-layered RTGS transfers and shell entities.'
      };
    }
  };

  const handleNodeClick = (nodeId: string) => {
    const rawNode = data.nodes.find(n => n.id === nodeId);
    if (rawNode) {
      const fullInfo = getComprehensiveNodeData(rawNode);
      setSelectedNodeDetails(fullInfo);
      if (onNodeSelect) {
        onNodeSelect(rawNode.label, rawNode.type);
      }
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const nodesList = data?.nodes || [];
    const edgesList = data?.edges || [];

    // Map raw nodes into vis-network visual options
    const formattedNodes = nodesList.map(node => {
      if (node.type === 'person') {
        const isGang = node.group === 'gang';
        const colorVal = node.score && node.score >= 0.7 
          ? '#ef4444' // Red for critical risk
          : isGang ? '#a855f7' : '#eab308'; // Purple for syndicate, Yellow for general
        
        return {
          id: node.id,
          label: node.label,
          shape: 'dot',
          borderWidth: 3,
          size: 22,
          color: {
            border: colorVal,
            background: '#111827',
            highlight: {
              border: '#ffffff',
              background: colorVal
            }
          },
          font: { color: '#f3f4f6', size: 11, face: 'Inter' },
          title: `Click to inspect dossier for ${node.label}`
        };
      } else {
        // Case node
        return {
          id: node.id,
          label: node.label,
          shape: 'box',
          margin: { top: 10, right: 10, bottom: 10, left: 10 },
          color: {
            border: '#3b82f6', // Blue
            background: '#0f172a',
            highlight: {
              border: '#ffffff',
              background: '#3b82f6'
            }
          },
          shapeProperties: {
            borderRadius: 6
          },
          borderWidth: 2,
          font: { color: '#f3f4f6', size: 11, face: 'Inter' },
          title: `Click to inspect FIR case dossier for ${node.label}`
        };
      }
    });

    const formattedEdges = edgesList.map(edge => ({
      from: edge.from,
      to: edge.to,
      label: edge.label,
      font: { color: '#6c757d', size: 8, face: 'Inter', strokeWidth: 0 },
      color: edge.color || { color: '#475569' },
      width: 1.5,
      dashes: edge.dashes || false,
      arrows: 'to;from'
    }));

    const graphData = {
      nodes: formattedNodes,
      edges: formattedEdges
    };

    const options = {
      nodes: {
        scaling: {
          min: 16,
          max: 32
        }
      },
      edges: {
        smooth: {
          enabled: true,
          type: 'continuous',
          roundness: 0.5
        }
      },
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -50,
          centralGravity: 0.01,
          springLength: 100,
          springConstant: 0.08
        },
        stabilization: {
          iterations: 100,
          fit: true
        }
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
        selectable: true
      }
    };

    // Instantiate vis Network
    networkRef.current = new Network(containerRef.current, graphData, options);

    // Event listener for single click OR double click
    networkRef.current.on('selectNode', (params: any) => {
      if (params.nodes.length > 0) {
        handleNodeClick(params.nodes[0]);
      }
    });

    networkRef.current.on('doubleClick', (params: any) => {
      if (params.nodes.length > 0) {
        handleNodeClick(params.nodes[0]);
      }
    });

    // Cleanup
    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [data]);

  const triggerResetPhysics = () => {
    if (networkRef.current) {
      networkRef.current.stabilize();
    }
  };

  return (
    <div className="card-panel rounded-lg border border-[#d1d9e6] p-6 text-[#1e3a5f] shadow-xl w-full my-4 relative">
      <div className="flex justify-between items-center border-b border-[#d1d9e6] pb-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-[#1e3a5f] flex items-center gap-2">
            <NetworkIcon className="text-[#1e3a5f]" size={20} /> Syndicate &amp; Case Association Network
          </h2>
          <p className="text-xs text-[#6c757d] mt-0.5">Click or double-click a node to view its related case records</p>
        </div>
        
        {/* Reset physics button */}
        <button 
          onClick={triggerResetPhysics}
          className="flex items-center gap-1.5 px-3 py-1 bg-[#f0f4f8] hover:bg-white border border-[#d1d9e6] hover:border-[#d1d9e6] text-[#2d4a6f] rounded-md text-xs font-semibold transition cursor-pointer"
          title="Stabilize Graph Layout"
        >
          <RefreshCw size={12} /> Re-center
        </button>
      </div>

      {/* Network Container */}
      <div 
        ref={containerRef} 
        className="w-full h-96 min-h-[400px] rounded-lg border border-[#d1d9e6] bg-[#0d2137]/60 overflow-hidden cursor-grab active:cursor-grabbing"
      />

      {/* Network Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-[10px] text-[#6c757d] border-t border-slate-900 pt-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500 border border-white/20" />
          <span>Critical Offender (Risk &ge; 70%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-yellow-500 border border-white/20" />
          <span>Accused Suspect</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-purple-500 border border-white/20" />
          <span>Syndicate Group Member</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-6 rounded bg-[#f0f4f8] border border-blue-500" />
          <span>FIR Case File</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="w-6 border-t-2 border-red-500 inline-block" />
          <span>Shared Accused Link</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 border-t-2 border-blue-500 inline-block" />
          <span>Modus Operandi Match</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* NODE INTELLIGENCE DOSSIER MODAL POPUP                       */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {selectedNodeDetails && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-sans">
          <div className="bg-white border border-slate-300 rounded-xl shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in duration-200">
            
            {/* Modal Header */}
            <div className="bg-[#1e3a5f] text-white p-4 flex justify-between items-center border-b border-[#2a4a73]">
              <div className="flex items-center gap-2.5">
                {selectedNodeDetails.type === 'person' ? (
                  <div className="p-2 bg-blue-500/20 rounded-lg text-blue-300 border border-blue-400/30">
                    <User size={20} />
                  </div>
                ) : (
                  <div className="p-2 bg-purple-500/20 rounded-lg text-purple-300 border border-purple-400/30">
                    <FileText size={20} />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-base text-white tracking-wide">{selectedNodeDetails.label}</h3>
                  <span className="text-[11px] text-slate-300 font-medium block">
                    {selectedNodeDetails.category}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedNodeDetails(null)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-700">
              
              {/* Risk Level Badge */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                  {selectedNodeDetails.type === 'person' ? (
                    <AlertTriangle size={16} className="text-red-600" />
                  ) : (
                    <Scale size={16} className="text-blue-600" />
                  )}
                  <span className="font-bold text-slate-800">
                    {selectedNodeDetails.type === 'person' ? 'Recidivism Risk Index' : 'Case Status'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedNodeDetails.type === 'person' ? (
                    <span className="px-2.5 py-1 bg-red-100 text-red-800 border border-red-200 rounded font-black text-xs">
                      {selectedNodeDetails.threatScore}% ({selectedNodeDetails.threatLevel})
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-800 border border-blue-200 rounded font-bold text-xs">
                      {selectedNodeDetails.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Person Node Attributes */}
              {selectedNodeDetails.type === 'person' && (
                <>
                  <div className="grid grid-cols-2 gap-3 bg-white p-3.5 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Demographics</span>
                      <strong className="text-slate-800">{selectedNodeDetails.age} Yrs · {selectedNodeDetails.gender}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Syndicate Gang</span>
                      <strong className="text-purple-700 font-bold">{selectedNodeDetails.gang}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Occupation / Role</span>
                      <strong className="text-slate-800">{selectedNodeDetails.occupation}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Prior Convictions</span>
                      <strong className="text-amber-700 font-bold">{selectedNodeDetails.priorConvictions} Cases Registered</strong>
                    </div>
                  </div>

                  <div className="space-y-2 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <MapPin size={14} className="text-[#1e3a5f]" /> Known Address &amp; Sector
                    </div>
                    <p className="text-slate-600 font-medium">{selectedNodeDetails.address}</p>
                    <span className="text-[10px] text-slate-400 block">Jurisdiction: {selectedNodeDetails.policeStation}</span>
                  </div>

                  <div className="space-y-2 bg-amber-500/10 p-3.5 rounded-lg border border-amber-500/20">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <DollarSign size={14} className="text-amber-700" /> Hawala &amp; Financial Volume
                    </div>
                    <p className="text-slate-700 font-medium">Tracked Volume: <strong className="text-red-600 font-mono text-sm">{selectedNodeDetails.totalHawalaVolume}</strong></p>
                    <span className="text-[10px] text-slate-500 block">Warrant Status: {selectedNodeDetails.warrantStatus}</span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Linked Co-Accused &amp; Network Nodes</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedNodeDetails.coAccused.map((ca: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-semibold">
                          {ca}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Case Node Attributes */}
              {selectedNodeDetails.type === 'case' && (
                <>
                  <div className="grid grid-cols-2 gap-3 bg-white p-3.5 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Registration Date</span>
                      <strong className="text-slate-800">{selectedNodeDetails.registrationDate}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Crime Type</span>
                      <strong className="text-blue-700 font-bold">{selectedNodeDetails.crimeType}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">BNS &amp; IT Act Section</span>
                      <strong className="text-slate-800">{selectedNodeDetails.bnsSection}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Stolen / Disputed Value</span>
                      <strong className="text-red-600 font-bold font-mono">{selectedNodeDetails.stolenAmount}</strong>
                    </div>
                  </div>

                  <div className="space-y-2 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <ShieldCheck size={14} className="text-[#1e3a5f]" /> Police Station &amp; Officer
                    </div>
                    <p className="text-slate-600 font-medium">Station: {selectedNodeDetails.policeStation} ({selectedNodeDetails.district})</p>
                    <span className="text-[10px] text-slate-500 block">IO: {selectedNodeDetails.investigatingOfficer}</span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Pinned Evidence Vault Items</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedNodeDetails.evidenceVault.map((ev: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[11px] font-semibold">
                          📄 {ev}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Node Summary Note */}
              <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 text-slate-600 font-medium leading-relaxed text-[11px]">
                <strong className="text-slate-800 block mb-0.5">Intelligence Summary:</strong>
                {selectedNodeDetails.details}
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-mono">NODE ID: {selectedNodeDetails.id}</span>
              <button
                onClick={() => setSelectedNodeDetails(null)}
                className="px-4 py-1.5 bg-[#1e3a5f] hover:bg-[#2a4a73] text-white font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5"
              >
                <span>Close Inspection</span>
                <ArrowRight size={12} />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
