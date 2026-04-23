// src/app/app.component.ts
import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

const LOGO_BAR = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAA2AUADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD4n0fTXm24TPtXdaP4buJVG2An1r174Yfs23ElrDqXi+VrHeNy2kfMuMcb88Ifbk17dpHwy8EaQgSHTC5UY3SuWNWos/O8x4joU5unTfNbtsfMeneDrnAzAcn2rorTwhcIButzX0zB4f8ADMQCx6XCo6cCrKaNoA62EX4DFarQ+eqZ+57RPnS28LzKB+5rUt/DswwfKNe6tonh9gQbRRzng0w+HdBblBsz2oOV5vzdDx+DQmAAMRq/FopH/LM/lXpx8M6Yc7J1FIPDEP8AyzKH/gVBnLMFLdnnsejt0EZq3FpDH+A/lXcjw8VPCE49ORTv7EZTjZz9KDKWNuzj49Mx/DU62BOBt4rqho6/w/ypf7MI6JQZvFJnOpp4XnFONgD1AroP7PbGaY9sFzxQCrXOfex2jpms3UIUjU7uOK3dV1PT9MiaW9uo4VA/iOPyrw34k/FuFoZLHR3OxgVaboT7Ck3Y7sHh6uJklBHH/GfxfHmXS7OYfJnzCO59K+b9bnMkpbNdd4m1druWR2JYn1NcQ8F3ql/Bp9hbTXN1dypBbwxIXklldgqIqjksSQAO5NYz1P0/KsIsNBRRkN940laXiLw34h8I61d+G/FWhX+jatYsEurG/t2guIGKhgHRsFSVZSM9iDWbWZ7yCgnFFFAxMZOaenWmYOfanpigViyOeaswjkGq0dW4QM4qkc83dl235IFaFuMEVRtwOOK0oFB24FM5KnU0bZVxnHetW2XnGOKz7VTjpWxaL0z1po8+qX7WMccVsWkPHSqNqvIyK2bWM4GKo86pJLQvWcPTiti2h5HFU7OI4FbdpATjirjsedUnbYs2sGcYrVt7bHReaitLcjHFbVpbFscdao86rVI4LPPUVN/ZqupGzrWtb2eCM1fSzBUECg4pVrHhXxt8EDUfDM2pQwk3Fh+9B55To35da+V72EwyMmMc1+iWsaHHqFlPaSoGSeNo2BHGCMGvgnxZpTafqNzakFTDK8f/AHySP6VnNdT7PhnGurGVKXQ/TFb5R1NP+3A/xfrXM/bR/eoa+IH360Pzr2J0b6jsGA1RNqpA+8a5p9RIH3qibUuCd9Bao3OmOrEcl6hfXSv/AC0/WuWl1L/bqlNqPP3v1oNI4ZPU69/ELf8APXH41A/iWReRMfxNcXNqWP4qoy6qRk7qDaOETO8bxjdQcpduuPQ0w/EXUIul2xx6jNecT6s3PzfrVCfVmxnf+tDdjeOXU3uj1Nvi3qUfD+Qw7ZUcVBJ8Z75BzbW5x9f8a8fudW6/vKyLrVnJIElS5I6YZRRktUeyXfxvv1B2xW6n/dzXK6x8adduUdBfiIf9MwBXll3qjnOXrCvdSfJG6o5md9DJqEdVE6jxD43vb5mae9lkY92YmvPdY1h5ixLk5qC+v2bOX4rnr68Jz81JyufQYTBxppWRS1O5Lljmr3wibd8ZPAeT/wAzVo//AKWw1z93MWz81bXwgb/i8ngE8Af8JXo+ST0H22HmpPoKFPlR9dfHv9n6y+O37XX7Tl9d+KbnRm+H/h9PE8Sw2qTC8aLToT5LbmGxTs+8Mnmvmv8AZU+B9p+0j8atE+Et94juNAh1e0vLlr6C3Wd4zBAZdoRiAc4xknivvLS7W41X9t/9r3wBZR513xd8PJbbRrSQhGu5DYQqAmeuTKvPTAY9jXzz/wAEzfAvjDSP2orbxhrnhrU9K0jwPouqza9d39pJbR2O62MQSRpFAV9xPy9cIx6CludR4/8ADz9nmPxNZ674x8beNLXwj4I0DUZ9Nk1e6j3yXkscjJsgjz8x4GTzycAMc45P4reGfhj4bvLCb4X/ABCn8T6ZcQP9rku7X7NNazq4AVlIX5WUghuhOR1Fdn8QviZonxN+E3gz4eeD7HVv7W0fVNTvrqxSzZ1vBPJNKk0RTJdlRzuBAI3MRkCvSP8Agnd8JvEmvfHS3+IWv+HzB8PfCWn6hdeKdQ1ey/4lz2zWrr9nfzl2SEsVkIwdoiLHGBk0PNwkcTVrSr15NK7SjZWstn5t7nyZkHoRTk61q+NNQ0fWPGfiDWfD1otrpN/q17d2Fuq7RFbSTu8SAdgEKjHbpWQjfNjFI9FlyOrcHLVSjO7irtuMEU0c81ZmjbqMgVp2q5x1rOthk/QVq2ae9M4qnU0rUdq27NAQPWsq1j6YHWtqxXaeaaPOqyNSziORW9ZR5ArLs4wQCBW/Yw5xxiqW55daRpWlv0rdsoORx2rPsoc44rfsoDwNvWtdjyq0rF6ztxgHFbNnbHIbFQ2FsSBla37Sz4A20Hk1aqQ61tSyg4rUtrNiuNtT2ll8o46Vq29qAudtB51WskY1zZrHA7MOAK+B/iZbrJr+ozooAe5lYY9CxNfdXxH1qHQdAupC4ErxlU+bnkV8OeMx5s8rk5JYnNRN9D63hTmUpVO59g/bR/eNI97xwx4rAW+yMlqGveDg1Z5HsUasl771BJejnnFZL3fHWq8l5gdaDSNE0pb7n71VJb7vurNkvB61SmvOuDQbxo6GlPqH0rPm1DPU1nT3h9aoT3nvUt22OmnQ0NGe9yD81Z09+QDg1RnvDt61nT3nHWpcmzsp0b7lu5vevP61l3F771WnvM5yazbq5HQHmpO6nRSJLu8PPP61jXd4xzz+tJc3B6ZrLuJzzg0r3O+lSI7u4ySN1Yt3N1zVm5mOTWVcSA5zSPSpQtuVLl8jJPeorBbmXUrVbO6S2uDPH5M7zeUsMm4bXMh+5tODu7YzSTMOQKgqWzuguiPZvGHx7/aC8c+O/D/xe8Q/FG2/4SjwvYwwaVqttdW1rPBEscsmSIwBI7hXEm4EMXVCPnCnsPij+2j+1h8ZfDVr8MvGnxI0ePSdcnNhdRaelrYfawGVSLudThITuBPKIygkjAIr5p75wM89qAABjHGMYouUlK+rOt0qLxX8Nr/RviToeuaPBqGi3ljqdi9tqUFxcRXAkeSJjCrEkq0Db1PQMgbiQV7H8X/2n/2pvj14afwz48+Lfh+TQGLefp2l3lrp8N0VaDPnKmHlGbiMhWOz5JTj90xHzfgA5CgEelIVU4yoODnoP89z+dF7FFjULOXTr+60+4kgkltZngd4JlmidlYglJFJV1JHDA4I5FVxjtS47UYxSEyxEc9DV6A9D6dazoiPWr8BPGO/WqRhUNa15x9K2LIetY9p2rashkimcFZ2NqzUnGK27OPOMjmsmyTjgV0NhGc81SR5NaTRrafCDj2rorGDgcVladCeMV0unW5bHFaJdTyK9SxqafbA810VjaglcA1R020JxxXVabYMxHyn8qo8TEVSxYWfAOOK6KxsiTnBpdN007VytdNYabhQ2MYFB4lat0K1rZHj5adqt3a6PatNcsBgZx3zT9Z8QafokBZmUvjkA5rw/wAe+PJb9nXzPlwcbTSbsgwmFqYuV0tDmfiv4xk1i4kA4iBIRc8AV89+IW3lyTnnNd14j1JpWYbs153q7l8+lZSd2fpGV4dUIKMT6RjuHKg0/wA5/Wiitj5/lRBLPIO9V5bh8Zz1oooNIJXKc08nXNU5Z329TRRQzoikUZp3Oeaozyv60UVkdkErFC4nfGOlZ80z5PNFFBvFKxQnmasy5lY57UUVLOymlczbmVgMdazppGxRRSO6CtYzp2Yk81myseQaKKDtplKUEnNM2miipZ1rYApNGDRRSGG00bTRRQAFSBmjafaiigB8Snir1tnp6UUVSMquxsWYJxW3ZKciiimeZXOj09ScV0unoOM0UVSPIrnVaZAuF5611umWqELRRWq2Pn8S2dlpVjHwK7TSdOiwvTn2oopnzuLb1OttbCK2gMzAEL2Fc94l8WzWaGK0iKcYzmiig82hFTqrmPH/ABNr95dF2eR8EngtXmeuXs0jNkmiilLY+2wMIxWiOH1Z2fJJrktQ6HPPNFFYvc+owysf/9k=';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="app-wrapper">
      @if (auth.currentUser()) {
        <div class="topbar">
          <div class="topbar-left">
            <img [src]="logo" alt="LUO" class="topbar-logo"/>
            <nav class="topbar-nav">
              <a routerLink="/dashboard" routerLinkActive="active" class="nav-btn">Dashboard</a>
              <a routerLink="/projects" routerLinkActive="active" class="nav-btn">Progetti</a>
              @if (auth.isAdmin) {
                <a routerLink="/users" routerLinkActive="active" class="nav-btn">Utenti</a>
                <a routerLink="/config" routerLinkActive="active" class="nav-btn">Config</a>
              }
            </nav>
          </div>
          <div class="topbar-right">
            <div class="user-chip">
              <div class="user-avatar">{{ initials() }}</div>
              <span class="user-name">{{ auth.currentUser()?.name }}</span>
              <span class="role-badge role-{{auth.currentUser()?.role}}">{{ auth.currentUser()?.role }}</span>
            </div>
            <button class="logout-btn" (click)="logout()">Esci</button>
          </div>
        </div>
        <div class="layout">
          <div class="main-content">
            <router-outlet />
          </div>
        </div>
      } @else {
        <router-outlet />
      }
    </div>
  `,
  styles: [`
    .app-wrapper { min-height: 100vh; background: var(--gray-50); }
    .topbar { background: #0f2820; display: flex; align-items: center; justify-content: space-between; padding: 0; height: 54px; position: sticky; top: 0; z-index: 100; overflow: hidden; }
    .topbar-left { display: flex; align-items: center; height: 100%; }
    .topbar-logo { height: 54px; width: auto; object-fit: cover; display: block; }
    .topbar-nav { display: flex; gap: 2px; padding: 0 8px; }
    .nav-btn { background: none; border: none; color: rgba(255,255,255,0.6); font-size: 13px; font-weight: 500; padding: 6px 14px; border-radius: 6px; cursor: pointer; text-decoration: none; display: flex; align-items: center; gap: 6px; transition: all .15s; font-family: inherit; }
    .nav-btn:hover, .nav-btn.active { color: white; background: rgba(255,255,255,0.12); }
    .topbar-right { display: flex; align-items: center; gap: 10px; padding-right: 20px; }
    .user-chip { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.08); border-radius: 20px; padding: 4px 12px 4px 4px; }
    .user-avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--green); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: var(--black); }
    .user-name { font-size: 12px; font-weight: 500; color: white; }
    .role-badge { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
    .role-admin { background: var(--green); color: var(--black); }
    .role-editor { background: #378add; color: white; }
    .role-viewer { background: rgba(255,255,255,0.2); color: white; }
    .logout-btn { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.6); background: none; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 5px 12px; cursor: pointer; font-family: inherit; transition: all .15s; }
    .logout-btn:hover { color: white; border-color: rgba(255,255,255,0.5); }
    .layout { display: flex; }
    .main-content { flex: 1; padding: 28px 32px; max-width: 1400px; margin: 0 auto; width: 100%; }
  `]
})
export class AppComponent {
  auth = inject(AuthService);
  private router = inject(Router);
  logo = LOGO_BAR;

  initials(): string {
    const name = this.auth.currentUser()?.name || '';
    return name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}