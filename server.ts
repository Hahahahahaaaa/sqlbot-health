import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

// In-memory data store for our mock backend
const availableDataSources = [
  "student_health_records (学生健康档案)", "student_vision_data (学生视力数据)", "school_staff_info (教职工信息)",
  "daily_attendance (日常考勤记录)", "pe_test_results (体测成绩)", "medical_history (既往病史)",
  "vaccination_records (疫苗接种记录)", "psychological_assessments (心理健康测评)", "canteen_nutrition_logs (食堂营养日志)",
  "campus_sports_facilities (体育设施情况)", "student_bmi_stats (学生BMI统计)", "dental_health_records (牙齿健康记录)",
  "yearly_physical_checkups (年度体检结果)", "infectious_disease_tracking (传染病追踪)", "student_insurance_info (学生保险信息)",
  "school_clinic_visits (校医室就诊记录)", "health_education_courses (健康教育课程)", "student_allergies_list (学生过敏史)",
  "parent_contact_info (家长联系方式)", "campus_safety_incidents (校园安全事件)"
];

let organizations: any[] = [
  { id: "1", name: "山西省教育厅", level: 1, parentId: null, dataSources: availableDataSources }
];
const cities = ["太原市", "大同市", "阳泉市", "长治市", "晋城市", "朔州市", "晋中市", "运城市", "忻州市", "临汾市", "吕梁市"];
cities.forEach((city, i) => {
  organizations.push({
    id: `c${i}`, name: `${city}教育局`, level: 2, parentId: "1", dataSources: availableDataSources.slice(0, 10).map(s => s.split(' ')[0])
  });
});
for(let i=0; i<18; i++) {
  organizations.push({
    id: `s${i}`, name: `${cities[i % cities.length]}第${(i%3)+1}中学`, level: 3, parentId: `c${i % cities.length}`, dataSources: availableDataSources.slice(10, 15).map(s => s.split(' ')[0])
  });
}

let roles: any[] = [
  { id: "r1", name: "超级管理员", description: "拥有系统最高权限，可管理所有组织、人员及其数据", permissions: ["chat", "org_view", "org_add", "org_edit", "org_delete", "role_view", "role_add", "role_edit", "role_delete", "account_view", "account_add", "account_edit", "account_delete"] },
  { id: "r2", name: "市级管理员", description: "管理全市教育健康数据，具有部分管理权限", permissions: ["chat", "org_view", "role_view", "account_view", "account_edit"] },
  { id: "r3", name: "校级管理员", description: "负责管理本校师生健康和体测记录", permissions: ["chat", "account_view"] }
];

let accounts: any[] = [];
const firstNames = ["赵", "钱", "孙", "李", "周", "吴", "郑", "王", "冯", "陈"];
const lastNames = ["伟", "芳", "娜", "敏", "静", "强", "磊", "军", "洋", "勇"];
for(let i=0; i<40; i++) {
  accounts.push({
    id: `u${i}`,
    name: `${firstNames[i % firstNames.length]}${lastNames[i % lastNames.length]}${i}`,
    phone: `13800000${i.toString().padStart(3, '0')}`,
    password: "password123",
    roleId: i === 0 ? "r1" : (i < 12 ? "r2" : "r3"),
    orgId: i === 0 ? "1" : organizations[1 + (i % (organizations.length - 1))].id
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/datasources", (req, res) => {
    res.json(availableDataSources.map(s => s.split(' ')[0])); // just return names for simplicity
  });
  
  // 1. Auth Endpoint
  app.post("/api/auth/login", (req, res) => {
    const { phone, password } = req.body;
    const user = accounts.find(a => a.phone === phone && a.password === password);
    if (user) {
      // In a real app we would use JWT. For mock, just return user info.
      const org = organizations.find(o => o.id === user.orgId);
      const role = roles.find(r => r.id === user.roleId);
      res.json({ token: `mock_token_${user.id}`, user: { ...user, org, role } });
    } else {
      res.status(401).json({ error: "账号或密码错误" });
    }
  });

  app.get("/api/organizations", (req, res) => res.json(organizations));
  app.post("/api/organizations", (req, res) => {
    const newOrg = { id: uuidv4(), ...req.body };
    organizations.push(newOrg);
    res.json(newOrg);
  });
  app.put("/api/organizations/:id", (req, res) => {
    const idx = organizations.findIndex(o => o.id === req.params.id);
    if (idx >= 0) {
      organizations[idx] = { ...organizations[idx], ...req.body };
      res.json(organizations[idx]);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });
  app.delete("/api/organizations/:id", (req, res) => {
    organizations = organizations.filter(o => o.id !== req.params.id);
    // Also might want to cascade delete or set parentIds to null, but let's keep it simple
    res.json({ success: true });
  });
  app.post("/api/organizations/sync", (req, res) => {
    // Mock sync data
    res.json({ success: true, message: "数据源同步成功" });
  });
  
  app.get("/api/roles", (req, res) => res.json(roles));
  app.post("/api/roles", (req, res) => {
    const newRole = { id: uuidv4(), ...req.body };
    roles.push(newRole);
    res.json(newRole);
  });
  app.put("/api/roles/:id", (req, res) => {
    const idx = roles.findIndex(r => r.id === req.params.id);
    if (idx >= 0) {
      roles[idx] = { ...roles[idx], ...req.body };
      res.json(roles[idx]);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });
  app.delete("/api/roles/:id", (req, res) => {
    roles = roles.filter(r => r.id !== req.params.id);
    res.json({ success: true });
  });
  
  app.get("/api/accounts", (req, res) => res.json(accounts));
  app.post("/api/accounts", (req, res) => {
    const newAccount = { id: uuidv4(), ...req.body, password: "password123" };
    accounts.push(newAccount);
    res.json(newAccount);
  });
  app.put("/api/accounts/:id", (req, res) => {
    const idx = accounts.findIndex(a => a.id === req.params.id);
    if (idx >= 0) {
      accounts[idx] = { ...accounts[idx], ...req.body };
      res.json(accounts[idx]);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });
  app.delete("/api/accounts/:id", (req, res) => {
    accounts = accounts.filter(a => a.id !== req.params.id);
    res.json({ success: true });
  });
  app.post("/api/accounts/:id/reset", (req, res) => {
    const idx = accounts.findIndex(a => a.id === req.params.id);
    if (idx >= 0) {
      accounts[idx].password = '123456';
      res.json({ success: true, message: "密码已重置为 123456" });
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  // Chat Endpoint
  app.post("/api/chat", async (req, res) => {
    // Return hardcoded response with chart data to satisfy the requirement
    res.json({ 
      reply: "各年级身高平均数统计", 
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
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
