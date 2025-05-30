import { Component, inject, OnInit, ViewChild, ElementRef, computed, signal, AfterViewInit, OnDestroy, effect } from '@angular/core';
import { UserService } from '../../../auth/services/user.service';
import { TranslationService } from '../../../core/services/translation.service';
import { CommonModule } from '@angular/common';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

interface DashboardOverview {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalOrganizations: number;
  newUsersThisMonth: number;
}

interface DashboardUser {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface MonthlyData {
  month: string;
  users: number;
}

interface RoleDistribution {
  role: string;
  count: number;
}

interface DashboardStats {
  overview: DashboardOverview;
  recentUsers: DashboardUser[];
  monthlyData: MonthlyData[];
  roleDistribution: RoleDistribution[];
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  imports: [
    CommonModule, 
    PanelModule, 
    ButtonModule, 
    SkeletonModule, 
    TagModule, 
    RouterModule,
    TranslateModule
  ],
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('monthlyChart') monthlyChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('roleChart') roleChartRef!: ElementRef<HTMLCanvasElement>;

  private userService = inject(UserService);
  private translationService = inject(TranslationService);
  private translateService = inject(TranslateService);
  
  // Signals
  private dashboardData = signal<DashboardStats | null>(null);
  private loading = signal<boolean>(true);
  
  // Computed properties
  dashboardStats = computed(() => this.dashboardData());
  isLoading = computed(() => this.loading());
  currentLang = computed(() => this.translationService.currentLang());

  // Chart instances
  private monthlyChart: Chart | null = null;
  private roleChart: Chart | null = null;

  constructor() {
    // Setup reactive data loading in constructor for injection context
    effect(() => {
      const isUserResolved = this.userService.isUserAccountResolved();
      const isAdmin = this.userService.isAdmin();
      const allUsersLoading = this.userService.allUsersLoading();

      // Only proceed when user is resolved
      if (!isUserResolved) {
        return;
      }

      // If not admin, set loading to false and return
      if (!isAdmin) {
        this.loading.set(false);
        this.dashboardData.set(null);
        return;
      }

      // If admin but still loading users, keep waiting
      if (allUsersLoading) {
        this.loading.set(true);
        return;
      }

      // Now we can load dashboard data
      this.loadDashboardStats();
    });

    // Effect to watch for language changes and regenerate charts
    effect(() => {
      const currentLang = this.currentLang();
      const stats = this.dashboardStats();
      
      // Only regenerate charts if we have data and charts exist
      if (stats && (this.monthlyChart || this.roleChart)) {
        // Small timeout to ensure translation service has updated
        setTimeout(() => {
          this.initializeCharts();
        }, 100);
      }
    });
  }

  ngOnInit() {
    // Component initialization if needed
  }

  ngAfterViewInit() {
    // Initialize charts after view is ready
    setTimeout(() => {
      if (this.dashboardStats()) {
        this.initializeCharts();
      }
    }, 100);
  }

  ngOnDestroy() {
    // Clean up chart instances
    if (this.monthlyChart) {
      this.monthlyChart.destroy();
    }
    if (this.roleChart) {
      this.roleChart.destroy();
    }
  }

  private async loadDashboardStats() {
    try {
      this.loading.set(true);
      const stats = await this.userService.getDashboardSummary();
      this.dashboardData.set(stats);
      
      // Initialize charts after data is loaded
      setTimeout(() => {
        this.initializeCharts();
      }, 100);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      this.dashboardData.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  private getTranslatedRole(role: string): string {
    return this.translateService.instant(`USER_ROLES.${role}`) || role;
  }

  private getTranslatedUsersRegistered(): string {
    return this.translateService.instant('ADMIN.CHARTS.USERS_REGISTERED') || 'Users Registered';
  }

  private initializeCharts() {
    const stats = this.dashboardStats();
    if (!stats) return;

    this.initializeMonthlyChart(stats.monthlyData);
    this.initializeRoleChart(stats.roleDistribution);
  }

  private initializeMonthlyChart(monthlyData: MonthlyData[]) {
    if (!this.monthlyChartRef?.nativeElement) return;

    const ctx = this.monthlyChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart
    if (this.monthlyChart) {
      this.monthlyChart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: monthlyData.map(d => d.month),
        datasets: [{
          label: this.getTranslatedUsersRegistered(),
          data: monthlyData.map(d => d.users),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    };

    this.monthlyChart = new Chart(ctx, config);
  }

  private initializeRoleChart(roleData: RoleDistribution[]) {
    if (!this.roleChartRef?.nativeElement) return;

    const ctx = this.roleChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart
    if (this.roleChart) {
      this.roleChart.destroy();
    }

    const colors = [
      'rgba(59, 130, 246, 0.8)',   // Blue
      'rgba(16, 185, 129, 0.8)',   // Green
      'rgba(245, 158, 11, 0.8)',   // Yellow
      'rgba(239, 68, 68, 0.8)',    // Red
      'rgba(139, 92, 246, 0.8)',   // Purple
    ];

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: roleData.map(d => this.getTranslatedRole(d.role)),
        datasets: [{
          data: roleData.map(d => d.count),
          backgroundColor: colors.slice(0, roleData.length),
          borderColor: colors.slice(0, roleData.length).map(color => color.replace('0.8', '1')),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          }
        }
      }
    };

    this.roleChart = new Chart(ctx, config);
  }

  getRoleSeverity(role: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    switch (role) {
      case 'Admin':
        return 'warn';
      case 'Super Admin':
        return 'success';
      default:
        return 'info';
    }
  }

  formatUserDate(dateString: string): string {
    const date = new Date(dateString);
    const lang = this.currentLang();
    
    // Mapeo de idiomas a locales
    const localeMap: Record<'es' | 'en' | 'zh', string> = {
      'es': 'es-ES',
      'en': 'en-US', 
      'zh': 'zh-CN'
    };
    
    const locale = localeMap[lang] || 'es-ES';
    
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  reloadPage() {
    this.loadDashboardStats();
  }
}
