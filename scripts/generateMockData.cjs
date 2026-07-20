const fs = require('fs');
const path = require('path');

const booksData = [
  { id: '1', title: '前夜·父与子', author: '[俄]屠格涅夫', category: '世界名著', module_id: '5' },
  { id: '2', title: '猎人笔记', author: '[俄]屠格涅夫', category: '世界名著', module_id: '5' },
  { id: '3', title: '罗亭·贵族之家', author: '[俄]屠格涅夫', category: '世界名著', module_id: '5' },
  { id: '4', title: '名利场（上）', author: '[英]威廉·萨克雷', category: '世界名著', module_id: '5' },
  { id: '5', title: '名利场（下）', author: '[英]威廉·萨克雷', category: '世界名著', module_id: '5' },
  { id: '6', title: '叶甫盖尼·奥涅金', author: '[俄]普希金', category: '世界名著', module_id: '5' },
  { id: '7', title: '昆虫记', author: '[法]法布尔', category: '科普读物', module_id: '6' },
  { id: '8', title: '哈姆雷特', author: '[英]莎士比亚', category: '世界名著', module_id: '5' },
  { id: '9', title: '变色龙', author: '[俄]契诃夫', category: '世界名著', module_id: '5' },
  { id: '10', title: '八十天环游地球', author: '[法]凡尔纳', category: '科普读物', module_id: '6' },
  { id: '11', title: '汤姆叔叔的小屋', author: '[美]斯托夫人', category: '世界名著', module_id: '5' },
  { id: '12', title: '百万英镑', author: '[美]马克·吐温', category: '世界名著', module_id: '5' },
  { id: '13', title: '堂吉诃德', author: '[西班牙]塞万提斯', category: '世界名著', module_id: '5' },
  { id: '14', title: '大卫·科波菲尔', author: '[英]狄更斯', category: '世界名著', module_id: '5' },
  { id: '15', title: '儒林外史', author: '[清]吴敬梓', category: '文学经典', module_id: '1' },
  { id: '16', title: '神秘岛', author: '[法]凡尔纳', category: '科普读物', module_id: '6' },
  { id: '17', title: '茶花女', author: '[法]小仲马', category: '世界名著', module_id: '5' },
  { id: '18', title: '第六病室', author: '[俄]契诃夫', category: '世界名著', module_id: '5' },
  { id: '19', title: '罗密欧与朱丽叶', author: '[英]莎士比亚', category: '世界名著', module_id: '5' },
  { id: '20', title: '悲惨世界', author: '[法]雨果', category: '世界名著', module_id: '5' },
  { id: '21', title: '老人与海', author: '[美]海明威', category: '世界名著', module_id: '5' },
  { id: '22', title: '海底两万里', author: '[法]凡尔纳', category: '科普读物', module_id: '6' },
  { id: '23', title: '瓦尔登湖', author: '[美]梭罗', category: '世界名著', module_id: '5' },
  { id: '24', title: '名人传', author: '[法]罗曼·罗兰', category: '世界名著', module_id: '5' },
  { id: '25', title: '安妮日记', author: '[德]安妮·弗兰克', category: '世界名著', module_id: '5' },
  { id: '26', title: '傲慢与偏见', author: '[英]奥斯丁', category: '世界名著', module_id: '5' },
  { id: '27', title: '红与黑', author: '[法]司汤达', category: '世界名著', module_id: '5' },
  { id: '28', title: '复活', author: '[俄]列夫·托尔斯泰', category: '世界名著', module_id: '5' },
  { id: '29', title: '假如给我三天光明', author: '[美]海伦·凯勒', category: '世界名著', module_id: '5' },
  { id: '30', title: '战争与和平', author: '[俄]托尔斯泰', category: '世界名著', module_id: '5' },
  { id: '31', title: '飘', author: '[美]米切尔', category: '世界名著', module_id: '5' },
  { id: '32', title: '基督山伯爵', author: '[法]大仲马', category: '世界名著', module_id: '5' },
  { id: '33', title: '雾都孤儿', author: '[英]狄更斯', category: '世界名著', module_id: '5' },
  { id: '34', title: '巴黎圣母院', author: '[法]雨果', category: '世界名著', module_id: '5' },
  { id: '35', title: '安娜·卡列尼娜', author: '[俄]列夫·托尔斯泰', category: '世界名著', module_id: '5' },
  { id: '36', title: '呼啸山庄', author: '[英]艾米莉·勃朗特', category: '世界名著', module_id: '5' },
  { id: '37', title: '简·爱', author: '[英]夏洛蒂·勃朗特', category: '世界名著', module_id: '5' },
  { id: '38', title: '钢铁是怎样炼成的', author: '[苏联]奥斯特洛夫斯基', category: '世界名著', module_id: '5' },
  { id: '39', title: '上尉的女儿', author: '[俄]普希金', category: '世界名著', module_id: '5' },
  { id: '40', title: '理智与情感', author: '[英]简·奥斯丁', category: '世界名著', module_id: '5' },
  { id: '41', title: '莎士比亚全集1', author: '[英]威廉·莎士比亚', category: '世界名著', module_id: '5' },
  { id: '42', title: '莎士比亚全集2', author: '[英]威廉·莎士比亚', category: '世界名著', module_id: '5' },
  { id: '43', title: '莎士比亚全集3', author: '[英]威廉·莎士比亚', category: '世界名著', module_id: '5' },
  { id: '44', title: '莎士比亚全集4', author: '[英]威廉·莎士比亚', category: '世界名著', module_id: '5' },
  { id: '45', title: '莎士比亚全集5', author: '[英]威廉·莎士比亚', category: '世界名著', module_id: '5' },
  { id: '46', title: '莎士比亚全集6', author: '[英]威廉·莎士比亚', category: '世界名著', module_id: '5' },
  { id: '47', title: '莎士比亚全集7', author: '[英]威廉·莎士比亚', category: '世界名著', module_id: '5' },
  { id: '48', title: '莎士比亚全集8', author: '[英]威廉·莎士比亚', category: '世界名著', module_id: '5' },
  { id: '49', title: '莎士比亚全集9', author: '[英]威廉·莎士比亚', category: '世界名著', module_id: '5' },
  { id: '50', title: '莎士比亚全集10', author: '[英]威廉·莎士比亚', category: '世界名著', module_id: '5' },
  { id: '51', title: '高老头', author: '[法]巴尔扎克', category: '世界名著', module_id: '5' },
  { id: '52', title: '欧也妮·葛朗台', author: '[法]巴尔扎克', category: '世界名著', module_id: '5' },
  { id: '53', title: '幻灭（上）', author: '[法]巴尔扎克', category: '世界名著', module_id: '5' },
  { id: '54', title: '幻灭（下）', author: '[法]巴尔扎克', category: '世界名著', module_id: '5' },
  { id: '55', title: '搅水女人', author: '[法]巴尔扎克', category: '世界名著', module_id: '5' },
  { id: '56', title: '十三人故事', author: '[法]巴尔扎克', category: '世界名著', module_id: '5' },
  { id: '57', title: '薇克多·雨果盛衰记', author: '[法]巴尔扎克', category: '世界名著', module_id: '5' },
  { id: '58', title: '贝姨', author: '[法]巴尔扎克', category: '世界名著', module_id: '5' },
  { id: '59', title: '邦斯舅舅', author: '[法]巴尔扎克', category: '世界名著', module_id: '5' },
  { id: '60', title: '公务员', author: '[法]巴尔扎克', category: '世界名著', module_id: '5' },
  { id: '61', title: '农民', author: '[法]巴尔扎克', category: '世界名著', module_id: '5' },
  { id: '62', title: '驴皮记', author: '[法]巴尔扎克', category: '世界名著', module_id: '5' },
  { id: '63', title: '中篇小说选', author: '[法]巴尔扎克', category: '世界名著', module_id: '5' },
  { id: '64', title: '列夫·托尔斯泰文集1', author: '[俄]列夫·托尔斯泰', category: '世界名著', module_id: '5' },
  { id: '65', title: '列夫·托尔斯泰文集2', author: '[俄]列夫·托尔斯泰', category: '世界名著', module_id: '5' },
  { id: '66', title: '列夫·托尔斯泰文集3', author: '[俄]列夫·托尔斯泰', category: '世界名著', module_id: '5' },
  { id: '67', title: '列夫·托尔斯泰文集4', author: '[俄]列夫·托尔斯泰', category: '世界名著', module_id: '5' },
  { id: '68', title: '列夫·托尔斯泰文集5', author: '[俄]列夫·托尔斯泰', category: '世界名著', module_id: '5' },
  { id: '69', title: '列夫·托尔斯泰文集6', author: '[俄]列夫·托尔斯泰', category: '世界名著', module_id: '5' },
  { id: '70', title: '列夫·托尔斯泰文集7', author: '[俄]列夫·托尔斯泰', category: '世界名著', module_id: '5' },
  { id: '71', title: '列夫·托尔斯泰文集8', author: '[俄]列夫·托尔斯泰', category: '世界名著', module_id: '5' },
  { id: '72', title: '列夫·托尔斯泰文集9', author: '[俄]列夫·托尔斯泰', category: '世界名著', module_id: '5' },
  { id: '73', title: '列夫·托尔斯泰文集10', author: '[俄]列夫·托尔斯泰', category: '世界名著', module_id: '5' },
  { id: '74', title: '列夫·托尔斯泰文集11', author: '[俄]列夫·托尔斯泰', category: '世界名著', module_id: '5' },
  { id: '75', title: '列夫·托尔斯泰文集12', author: '[俄]列夫·托尔斯泰', category: '世界名著', module_id: '5' },
  { id: '76', title: '列夫·托尔斯泰文集13', author: '[俄]列夫·托尔斯泰', category: '世界名著', module_id: '5' },
  { id: '77', title: '列夫·托尔斯泰文集14', author: '[俄]列夫·托尔斯泰', category: '世界名著', module_id: '5' },
  { id: '78', title: '列夫·托尔斯泰文集15', author: '[俄]列夫·托尔斯泰', category: '世界名著', module_id: '5' },
  { id: '79', title: '列夫·托尔斯泰文集16', author: '[俄]列夫·托尔斯泰', category: '世界名著', module_id: '5' },
  { id: '80', title: '列夫·托尔斯泰文集17', author: '[俄]列夫·托尔斯泰', category: '世界名著', module_id: '5' },
  { id: '81', title: '安娜·卡列尼娜（英汉对照）上', author: '[俄]列夫·托尔斯泰', category: '世界名著', module_id: '5' },
  { id: '82', title: '安娜·卡列尼娜（英汉对照）下', author: '[俄]列夫·托尔斯泰', category: '世界名著', module_id: '5' },
  { id: '83', title: '忏悔录（英汉对照）上', author: '[法]卢梭', category: '世界名著', module_id: '5' },
  { id: '84', title: '忏悔录（英汉对照）下', author: '[法]卢梭', category: '世界名著', module_id: '5' },
  { id: '85', title: '飘（英汉对照）上', author: '[美]米切尔', category: '世界名著', module_id: '5' },
  { id: '86', title: '飘（英汉对照）下', author: '[美]米切尔', category: '世界名著', module_id: '5' },
  { id: '87', title: '简爱（英汉对照）', author: '[英]夏洛蒂·勃朗特', category: '世界名著', module_id: '5' },
  { id: '88', title: '小公务员之死', author: '[俄]契诃夫', category: '世界名著', module_id: '5' },
  { id: '89', title: '百年孤独', author: '[哥伦比亚]加西亚·马尔克斯', category: '世界名著', module_id: '5' },
  { id: '90', title: '红与白', author: '[法]司汤达', category: '世界名著', module_id: '5' },
  { id: '91', title: '罪与罚', author: '[俄]陀思妥耶夫斯基', category: '世界名著', module_id: '5' },
  { id: '92', title: '卡拉马佐夫兄弟（上）', author: '[俄]陀思妥耶夫斯基', category: '世界名著', module_id: '5' },
  { id: '93', title: '卡拉马佐夫兄弟（下）', author: '[俄]陀思妥耶夫斯基', category: '世界名著', module_id: '5' },
  { id: '94', title: '安徒生童话全集', author: '[丹麦]安徒生', category: '儿童读物', module_id: '4' },
  { id: '95', title: '福尔摩斯探案集', author: '[英]柯南·道尔', category: '世界名著', module_id: '5' },
  { id: '96', title: '假如给我三天光明（全）', author: '[美]海伦·凯勒', category: '世界名著', module_id: '5' },
  { id: '97', title: '寂静的春天', author: '[美]蕾切尔·卡森', category: '科普读物', module_id: '6' },
  { id: '98', title: '泰戈尔诗集', author: '[印度]泰戈尔', category: '世界名著', module_id: '5' },
  { id: '99', title: '古希腊神话与传说', author: '[德]施瓦布', category: '人文历史', module_id: '3' },
  { id: '100', title: '母亲', author: '[俄]高尔基', category: '世界名著', module_id: '5' },
  { id: '101', title: '在人间·我的大学', author: '[俄]高尔基', category: '世界名著', module_id: '5' },
  { id: '102', title: '三个火枪手', author: '[法]大仲马', category: '世界名著', module_id: '5' },
  { id: '103', title: '瓦尔登湖（全）', author: '[美]梭罗', category: '世界名著', module_id: '5' },
  { id: '104', title: '汤姆叔叔的小屋（全）', author: '[美]斯托夫人', category: '世界名著', module_id: '5' },
  { id: '105', title: '童年', author: '[俄]高尔基', category: '世界名著', module_id: '5' },
  { id: '106', title: '呼啸山庄（全）', author: '[英]艾米莉·勃朗特', category: '世界名著', module_id: '5' },
  { id: '107', title: '莎士比亚戏剧集', author: '[英]威廉·莎士比亚', category: '世界名著', module_id: '5' },
  { id: '108', title: '汤姆·索亚历险记', author: '[美]马克·吐温', category: '世界名著', module_id: '5' },
  { id: '109', title: '金银岛', author: '[英]史蒂文森', category: '世界名著', module_id: '5' },
  { id: '110', title: '我是猫', author: '[日]夏目漱石', category: '世界名著', module_id: '5' },
  { id: '111', title: '昆虫记（全）', author: '[法]法布尔', category: '科普读物', module_id: '6' },
  { id: '112', title: '名人传', author: '[法]罗曼·罗兰', category: '世界名著', module_id: '5' },
  { id: '113', title: '巴黎圣母院（全）', author: '[法]雨果', category: '世界名著', module_id: '5' },
  { id: '114', title: '海底两万里（全）', author: '[法]凡尔纳', category: '科普读物', module_id: '6' },
  { id: '115', title: '傲慢与偏见（全）', author: '[英]奥斯丁', category: '世界名著', module_id: '5' },
  { id: '116', title: '红与黑（全）', author: '[法]司汤达', category: '世界名著', module_id: '5' },
  { id: '117', title: '猎人笔记（全）', author: '[俄]屠格涅夫', category: '世界名著', module_id: '5' },
  { id: '118', title: '钢铁是怎样炼成的（全）', author: '[苏联]奥斯特洛夫斯基', category: '世界名著', module_id: '5' },
  { id: '119', title: '鲁滨孙漂流记', author: '[英]笛福', category: '世界名著', module_id: '5' },
  { id: '120', title: '复活', author: '[俄]列夫·托尔斯泰', category: '世界名著', module_id: '5' },
  { id: '121', title: '老人与海（全）', author: '[美]海明威', category: '世界名著', module_id: '5' },
  { id: '122', title: '简·爱', author: '[英]夏洛蒂·勃朗特', category: '世界名著', module_id: '5' },
  { id: '123', title: '飘（全）上', author: '[美]米切尔', category: '世界名著', module_id: '5' },
  { id: '124', title: '飘（全）下', author: '[美]米切尔', category: '世界名著', module_id: '5' },
  { id: '125', title: '悲惨世界（全）上', author: '[法]雨果', category: '世界名著', module_id: '5' },
  { id: '126', title: '悲惨世界（全）下', author: '[法]雨果', category: '世界名著', module_id: '5' },
  { id: '127', title: '童年的秘密', author: '[意]蒙台梭利', category: '教育读物', module_id: '2' },
  { id: '128', title: '麦田的守望者', author: '[美]J.D.塞林格', category: '世界名著', module_id: '5' },
  { id: '129', title: '麦田的守望者（英文原著）', author: '[美]J.D.塞林格', category: '世界名著', module_id: '5' },
  { id: '130', title: '阴谋与爱情', author: '[德]席勒', category: '世界名著', module_id: '5' },
  { id: '131', title: '涅朵奇卡一个女人的一生', author: '[俄]陀思妥耶夫斯基', category: '世界名著', module_id: '5' },
  { id: '132', title: '穷人', author: '[俄]陀思妥耶夫斯基', category: '世界名著', module_id: '5' },
];

const content = `import type { User, Book, Module, BorrowRecord, Family } from '@/types';

function generateCover(title: string, author: string, category: string, index: number): string {
  const basePrompts: Record<string, string> = {
    '世界名著': 'masterpiece classic literature book cover, elegant, sophisticated design, literary style, hardcover, artistic illustration, vertical portrait, professional book design',
    '文学经典': 'Chinese classic literature book cover, traditional ink painting style, elegant calligraphy, cultural heritage, scholarly design, vertical portrait',
    '科普读物': 'science and nature book cover, educational, modern design, scientific illustrations, clean minimalist style, vertical portrait',
    '人文历史': 'history and humanities book cover, ancient artifacts, historical scenes, vintage style, academic design, vertical portrait',
    '儿童读物': 'children book cover, colorful, whimsical, fairy tale style, cute illustrations, joyful design, vertical portrait',
    '科技科普': 'technology and science book cover, futuristic design, digital elements, modern tech style, clean and sleek, vertical portrait',
    '教育读物': 'education and teaching book cover, academic design, clean layout, professional style, vertical portrait',
  };

  const basePrompt = basePrompts[category] || basePrompts['世界名著'];
  const prompt = encodeURIComponent(\`"\${title}" by \${author}, \${basePrompt}\`);
  const seed = Math.abs(title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + index * 17);
  return \`https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=\${prompt}&image_size=portrait_4_3&seed=\${seed}\`;
}

export const mockFamilies: Family[] = [
  {
    id: 'family1',
    name: '张三家庭',
    head_of_family: 'user1',
    members: ['user1'],
    created_at: '2024-07-01',
  },
  {
    id: 'family2',
    name: '李四家庭',
    head_of_family: 'user2',
    members: ['user2'],
    created_at: '2024-07-05',
  },
];

export const mockModules: Module[] = [
  { id: '1', name: '文学经典', type: 'school', is_public: true, created_at: '2024-01-01' },
  { id: '2', name: '科技科普', type: 'school', is_public: true, created_at: '2024-01-01' },
  { id: '3', name: '人文历史', type: 'school', is_public: true, created_at: '2024-01-01' },
  { id: '4', name: '儿童读物', type: 'school', is_public: true, created_at: '2024-01-01' },
  { id: '5', name: '世界名著', type: 'school', is_public: true, created_at: '2024-01-01' },
  { id: '6', name: '科普读物', type: 'school', is_public: true, created_at: '2024-01-01' },
  { id: 'family_mod1', name: '张三家庭藏书', type: 'family', owner_id: 'family1', is_public: false, created_at: '2024-07-01' },
  { id: 'family_mod2', name: '李四家庭藏书', type: 'family', owner_id: 'family2', is_public: false, created_at: '2024-07-05' },
];

export const mockBooks: Book[] = [
${booksData.map((book, index) => `  { id: '${book.id}', title: '${book.title}', author: '${book.author}', category: '${book.category}', isbn: '', description: '', cover_url: generateCover('${book.title}', '${book.author}', '${book.category}', ${index}), total_copies: 1, available_copies: 1, module_id: '${book.module_id}', created_at: '2024-07-19', updated_at: '2024-07-19' }`).join(',\n')}
];

export const mockUsers: User[] = [
  { id: 'user1', email: 'admin@library.com', name: '管理员', role: 'admin', approved: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'user2', email: 'user@library.com', name: '普通用户', role: 'user', approved: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
];

export const mockPasswords: Record<string, string> = {
  'admin@library.com': 'admin123',
  'user@library.com': 'user123',
};

export const mockBorrowRecords: BorrowRecord[] = [];
`;

fs.writeFileSync(path.join(__dirname, '../src/utils/mockData.ts'), content, 'utf-8');
console.log('Generated mockData.ts with 132 books');
