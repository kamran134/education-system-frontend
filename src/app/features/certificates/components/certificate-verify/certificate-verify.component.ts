import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LucideAngularModule, CheckCircle2, XCircle, HelpCircle } from 'lucide-angular';
import { CertificateService } from '../../services/certificate.service';
import { CertificateData } from '../../../../core/models/certificate.model';

type VerifyState = 'loading' | 'valid' | 'revoked' | 'not-found';

const AZ_MONTHS = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
    'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr',
];

@Component({
    selector: 'app-certificate-verify',
    imports: [CommonModule, RouterModule, LucideAngularModule],
    templateUrl: './certificate-verify.component.html',
    styleUrl: './certificate-verify.component.scss',
})
export class CertificateVerifyComponent implements OnInit {
    readonly CheckCircle2 = CheckCircle2;
    readonly XCircle = XCircle;
    readonly HelpCircle = HelpCircle;

    state: VerifyState = 'loading';
    serial: string | null = null;
    issuedAt: string | null = null;
    revokedAt: string | null = null;
    data: CertificateData | null = null;

    constructor(
        private route: ActivatedRoute,
        private certificateService: CertificateService
    ) {}

    ngOnInit(): void {
        const token = this.route.snapshot.paramMap.get('token');
        if (!token) {
            this.state = 'not-found';
            return;
        }
        this.certificateService.verifyByToken(token).subscribe({
            next: (res) => {
                if (!res.valid && !res.serial) {
                    this.state = 'not-found';
                    return;
                }
                this.serial = res.serial ?? null;
                this.issuedAt = res.issuedAt ?? null;
                this.revokedAt = res.revokedAt ?? null;
                this.data = (res.data as CertificateData) ?? null;
                this.state = res.valid ? 'valid' : 'revoked';
            },
            error: () => (this.state = 'not-found'),
        });
    }

    monthName(month: number): string {
        return AZ_MONTHS[month - 1] ?? String(month);
    }
}
