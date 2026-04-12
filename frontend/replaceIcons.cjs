const fs = require('fs');
const path = 'D:/HOST/CYS/NexusSocial/frontend/src/pages/BlockchainPage.jsx';
let content = fs.readFileSync(path, 'utf8');

const replacements = {
  'HiShieldCheck': 'FiShield',
  'HiDatabase': 'FiDatabase',
  'HiServer': 'FiServer',
  'HiCheckCircle': 'FiCheckCircle',
  'HiXCircle': 'FiXCircle',
  'HiUsers': 'FiUsers',
  'HiDocumentText': 'FiFileText',
  'HiChatAlt2': 'FiMessageSquare',
  'HiSparkles': 'FiStar',
  'HiFlag': 'FiFlag',
  'HiTrash': 'FiTrash2',
  'HiLink': 'FiLink',
  'HiInformationCircle': 'FiInfo',
  'HiCube': 'FiBox'
};

for (const [oldIcon, newIcon] of Object.entries(replacements)) {
  content = content.replace(new RegExp(oldIcon, 'g'), newIcon);
}

const importRegex = /import\s+\{[\s\S]*?\}\s+from\s+'react-icons\/hi'/;
content = content.replace(importRegex, "import { FiShield, FiDatabase, FiServer, FiCheckCircle, FiXCircle, FiUsers, FiFileText, FiMessageSquare, FiStar, FiFlag, FiTrash2, FiLink, FiInfo, FiBox } from 'react-icons/fi'");

fs.writeFileSync(path, content, 'utf8');
