/** 첫 화면(랜딩) 밖의 화면과 무거운 3D 묶음은 따로 받는다 */
export const loadDashboardPage = () => import('./pages/dashboard/DashboardPage')
export const loadLoginPage = () => import('./pages/login/LoginPage')
export const loadWorkspacePage = () => import('./pages/workspace/WorkspacePage')
export const loadTwinScene = () => import('./features/twin/scene/TwinScene')
