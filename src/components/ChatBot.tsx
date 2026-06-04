import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, MessageSquare, Plus, Trash2, Table, LineChart as LineChartIcon } from 'lucide-react';
import Markdown from 'react-markdown';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  widget?: string;
  chartData?: Array<{ grade: string, height: number }>;
  tableData?: any[];
  tableColumns?: string[];
  tableTitle?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
}

function DataGridWidget({ title, data, columns }: { title: string, data: any[], columns: string[] }) {
  return (
    <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden bg-white w-full max-w-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
        <h3 className="font-medium text-slate-800">{title}</h3>
        <div className="flex bg-white border border-slate-200 rounded-lg p-1">
          <button className="p-1.5 rounded-md flex items-center justify-center bg-blue-50 text-blue-600 shadow-sm">
            <Table size={16} />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map(c => <th key={c} className="py-3 px-4 font-medium text-slate-600">{c} ▾</th>)}
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                {columns.map(c => <td key={c} className="py-3 px-4 text-slate-700">{item[c]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HeightChartWidget({ data }: { data: any[] }) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  
  return (
    <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden bg-white w-full max-w-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h3 className="font-medium text-slate-800">各年级身高平均数统计</h3>
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button 
            onClick={() => setView('chart')}
            className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${view === 'chart' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            title="折线图视图"
          >
            <LineChartIcon size={16} />
          </button>
          <button 
            onClick={() => setView('table')}
            className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${view === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            title="表格视图"
          >
            <Table size={16} />
          </button>
        </div>
      </div>
      <div className="p-4 overflow-x-auto w-full">
        {view === 'chart' ? (
          <div className="h-64 sm:h-80 min-w-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis domain={['dataMin - 5', 'dataMax + 5']} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} unit="" width={40} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1E293B', marginBottom: '4px' }}
                  itemStyle={{ color: '#2563EB' }}
                  formatter={(value: number) => [`${value.toFixed(1)} cm`, '平均身高']}
                />
                <Line type="monotone" dataKey="height" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#fff', strokeWidth: 2, stroke: '#3b82f6' }} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="w-full">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-4 font-medium text-slate-500">年级</th>
                  <th className="py-3 px-4 font-medium text-slate-500 text-right">平均身高 (cm)</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-800">{item.grade}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">{item.height.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const DEFAULT_MESSAGE: ChatMessage = { role: 'assistant', content: '您好！我是“山西校园健康数问平台”智能助手。您可以向我询问有关学生体检、健康考评等数据信息。' };

const BMI_ANALYSIS_MARKDOWN = `好的，收到您的数据。我将对这份关于学生BMI值分布的数据进行分析。

### 数据分析报告

根据您提供的数据，我对学生BMI值的分布情况进行了分析。数据包含了从4.8到181.8的BMI值及其对应的学生人数。

**1. 核心发现：分布形态与峰值**

*   **总体分布**: 数据呈现出一个典型的**右偏态分布** (或称正偏态分布)。这意味着大部分学生的BMI值集中在较低或中等区间，而高BMI值的学生数量较少，但存在一些极端高值。
*   **分布中心与峰值**:
    *   **峰值区间**: 学生人数最多的BMI值集中在 **13.0 至 20.0** 之间。其中，BMI=15.0 的学生人数达到峰值**7502人**，是分布最密集的点。
    *   **主要集中区间**: 大约 **95%** 的学生BMI值落在 **10.0 至 30.0** 的范围内。这个区间是学生BMI的主体部分。

**2. 关键统计量估算**

基于数据，我可以估算出以下关键指标（由于是离散数据，计算为近似值）：

*   **学生总数**: 对所有 \`student_count\` 求和，得到总学生人数约为 **392,000人**。
*   **众数 (Mode)**: 即出现次数最多的值，为 **BMI = 15.0**（对应7502人）。
*   **中位数 (Median)** 位置: 位于总人数一半的位置（约第196,000名学生）。通过累计人数计算，中位数落在 BMI约 **16.7 至 16.8** 的区间内。这表明至少一半学生的BMI低于16.8。
*   **平均值 (Mean)** 估算: 由于数据右偏且存在极端高值（如181.8），平均值会明显高于中位数。粗略估算，平均BMI可能在 **18.5 - 19.5** 之间。这些极端高值会显著拉高整体平均值。

**3. 分布细节解读**

*   **低BMI区间 (<18.5，通常视为偏瘦)**:
    *   数据从BMI=4.8开始，在15.0之前人数快速增长，符合青少年生长发育的特点。
    *   需要关注BMI低于13.0的极低值学生，虽然人数少，但可能属于营养不良或需要特别关注的群体。
*   **正常/高BMI区间**:
    *   **平台期**: BMI在15.0至20.0之间形成了一个很高的“平台”，学生人数维持在7000-8000人左右，是学生群体的主力。
    *   **衰减期**: BMI超过20.0后，学生人数开始呈现稳定且快速的指数衰减趋势。例如，BMI=25.0时人数降至1953人，BMI=30.0时降至475人。
*   **极端高值 (Outliers)**:
    *   数据在BMI>40.0后仍有记录，直至181.8。这些极少数极端值（如BMI>50.0的个例）需要谨慎核查，可能是数据录入错误、测量单位问题（如将体重误录为克？）或罕见的病理情况。**这些值对整体统计分析（尤其是平均值）影响巨大。**`;

const SICK_LEAVE_DATA = [
  { '学生姓名': '郑明', '性别': 'M', '证件': '500101********387X', '学校名称': '育才小学', '年级名称': '小学2024级', '班级名称': '小学2024级3班', '请假原因': '流行性感冒/发烧', '症状': '' },
  { '学生姓名': '陈华', '性别': 'F', '证件': '500102********1242', '学校名称': '实验小学', '年级名称': '小学2023级', '班级名称': '小学2023级1班', '请假原因': '流行性感冒/咳嗽', '症状': '' },
  { '学生姓名': '彭宇', '性别': 'M', '证件': '500213********4511', '学校名称': '重庆市渝中区小学', '年级名称': '小学2024级', '班级名称': '小学2024级8班', '请假原因': '流行性感冒/头痛', '症状': '' },
  { '学生姓名': '黄静', '性别': 'F', '证件': '500381********7722', '学校名称': '永川中学(北)', '年级名称': '高中2023级', '班级名称': '高中2023级1班', '请假原因': '流行性感冒/发热', '症状': '' },
  { '学生姓名': '俞杰', '性别': 'M', '证件': '500114********2231', '学校名称': '农业科学院附属小学', '年级名称': '小学2023级', '班级名称': '小学2023级1班', '请假原因': '流行性感冒', '症状': '' },
  { '学生姓名': '康妮', '性别': 'F', '证件': '500105********5545', '学校名称': '康巴什第六小学', '年级名称': '小学2023级', '班级名称': '小学2023级6班', '请假原因': '流行性感冒', '症状': '' },
];
const SICK_LEAVE_COLUMNS = ['学生姓名', '性别', '证件', '学校名称', '年级名称', '班级名称', '请假原因', '症状'];

export default function ChatBot() {
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: "demo_combined",
      title: "校园健康数据综合查询演示",
      messages: [
        DEFAULT_MESSAGE,
        { role: "user", content: "全市各年级的平均身高" }, 
        { 
          role: "assistant", 
          content: "各年级身高平均数统计",
          widget: "height_chart",
          chartData: [
            { grade: '小学一年级', height: 123.5 },
            { grade: '小学二年级', height: 128.2 },
            { grade: '小学三年级', height: 135.4 },
            { grade: '小学四年级', height: 141.0 },
            { grade: '小学五年级', height: 147.5 },
            { grade: '小学六年级', height: 153.2 },
            { grade: '初中一年级', height: 160.1 },
            { grade: '初中二年级', height: 165.8 },
            { grade: '初中三年级', height: 169.5 },
            { grade: '高中一年级', height: 172.0 },
            { grade: '高中二年级', height: 173.5 },
            { grade: '高中三年级', height: 174.1 }
          ] 
        },
        { role: "user", content: "展示2025年学生体检BMI分布" },
        { 
          role: "assistant", 
          content: BMI_ANALYSIS_MARKDOWN 
        },
        { role: "user", content: "今天流感请假的学生" },
        {
          role: "assistant",
          content: "找到以下今天因流感请假的学生：",
          widget: "data_grid",
          tableTitle: "今天流感请假学生",
          tableData: SICK_LEAVE_DATA,
          tableColumns: SICK_LEAVE_COLUMNS
        }
      ]
    },
    {
      id: "1",
      title: "太原一中体测及近视率分析...",
      messages: [DEFAULT_MESSAGE, { role: "user", content: "太原一中体测及近视率分析" }, { role: "assistant", content: "根据数据库显示，太原第一中学本年度体测优良率为78%，近视率达到55%，相较去年有所上升。" }]
    },
    {
      id: "2",
      title: "2024年初三学生BMI数据查询",
      messages: [DEFAULT_MESSAGE, { role: "user", content: "2024年初三学生BMI数据查询" }, { role: "assistant", content: "已为您查询到2024年初三学生BMI平均值为21.4，大部分处于健康区间。" }]
    },
    {
      id: "3",
      title: "新对话",
      messages: [DEFAULT_MESSAGE]
    }
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>("demo_combined");
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const createNewSession = () => {
    const newSession = {
      id: Date.now().toString(),
      title: "新对话",
      messages: [DEFAULT_MESSAGE]
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => {
      const remaining = prev.filter(s => s.id !== id);
      if (remaining.length === 0) {
        const newSession = {
          id: Date.now().toString(),
          title: "新对话",
          messages: [DEFAULT_MESSAGE]
        };
        setActiveSessionId(newSession.id);
        return [newSession];
      }
      if (activeSessionId === id) {
        setActiveSessionId(remaining[0].id);
      }
      return remaining;
    });
  };

  const updateCurrentSession = (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: updater(s.messages) } : s));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    updateCurrentSession(prev => [...prev, { role: 'user', content: userMsg }]);
    
    // Update title if it's the first user message
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId && s.messages.length === 1) {
        return { ...s, title: userMsg.slice(0, 15) + (userMsg.length > 15 ? '...' : '') };
      }
      return s;
    }));

    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || '请求出错');
      }

      updateCurrentSession(prev => [...prev, { 
        role: 'assistant', 
        content: data.reply,
        widget: data.widget,
        chartData: data.chartData
      }]);
    } catch (error: any) {
      updateCurrentSession(prev => [...prev, { role: 'assistant', content: `[错误提示]: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-white relative">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-100 bg-slate-50/50 flex-col hidden md:flex shrink-0">
        <div className="p-4">
          <button onClick={createNewSession} className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-[14px] font-medium transition-colors shadow-sm">
            <Plus size={16} />
            新建对话
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2 mt-2">历史记录</h3>
          <div className="space-y-1">
            {sessions.map(s => (
              <div 
                key={s.id} 
                onClick={() => setActiveSessionId(s.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${activeSessionId === s.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100 text-slate-600'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare size={16} className={`shrink-0 ${activeSessionId === s.id ? "text-blue-500" : "text-slate-400"}`} />
                  <span className="text-sm truncate font-medium">{s.title}</span>
                </div>
                <button onClick={(e) => deleteSession(s.id, e)} className={`shrink-0 opacity-0 group-hover:opacity-100 p-1 hover:bg-white/50 rounded hover:text-red-500 transition-all ${activeSessionId === s.id ? 'hover:bg-blue-100/50' : ''}`}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Header */}
        <header className="h-16 flex items-center px-6 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-medium text-slate-800">智能问答 (SQLBot)</h2>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex ${msg.role === 'user' ? 'max-w-[85%] lg:max-w-[70%] flex-row-reverse space-x-reverse' : `${msg.widget ? 'w-[95%] lg:w-[90%]' : 'max-w-[90%] lg:max-w-[85%]'} flex-row space-x-3`}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  msg.role === 'assistant' ? 'bg-blue-100 text-blue-600' : 'bg-slate-800 text-white'
                }`}>
                  {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                </div>
                <div className={`px-4 py-3 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-sm' 
                    : `bg-slate-100 text-slate-800 rounded-tl-sm ${msg.widget ? 'w-full' : ''}`
                }`}>
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.content}</p>
                  ) : (
                    <div className="w-full">
                      <div className="prose prose-sm max-w-none text-slate-800">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                      {msg.widget === 'height_chart' && msg.chartData && (
                        <HeightChartWidget data={msg.chartData} />
                      )}
                      {msg.widget === 'data_grid' && msg.tableData && msg.tableColumns && msg.tableTitle && (
                        <DataGridWidget title={msg.tableTitle} data={msg.tableData} columns={msg.tableColumns} />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex space-x-3 max-w-[80%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <div className="px-5 py-4 bg-slate-100 rounded-2xl rounded-tl-sm flex items-center space-x-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-end space-x-2 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="例如您可以问我全市各年级的平均身高"
              className="flex-1 max-h-32 min-h-[56px] resize-none bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-[15px]"
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 h-[56px] w-[56px] bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-2xl flex items-center justify-center transition-colors"
            >
              {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Send size={20} className="ml-1" />}
            </button>
          </form>
          <p className="text-center text-xs text-slate-400 mt-3 hidden sm:block">智能问答系统可能产生不准确的响应，请核实关键信息</p>
        </div>
      </div>
    </div>
  );
}
