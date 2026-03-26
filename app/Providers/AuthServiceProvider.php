<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Policies\ApplicantDocumentPolicy;
use App\Policies\ApplicantsPolicy;
use App\Policies\ApplicationsPolicy;
use App\Policies\VacanciesPolicy;
use App\Policies\PublicationsPolicy;
use App\Policies\FlexiplaceSchedulePolicy;
use App\Policies\FlexiplaceDtrPolicy;
use App\Policies\FlexiplaceReportsPolicy;
use App\Policies\GapAnalysisPolicy;
use App\Policies\PerformancePolicy;
use App\Policies\SettingsPolicy;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        Gate::policy('applicant-documents', ApplicantDocumentPolicy::class);
        Gate::policy('applicants', ApplicantsPolicy::class);
        Gate::policy('applications', ApplicationsPolicy::class);
        Gate::policy('vacancies', VacanciesPolicy::class);
        Gate::policy('publications', PublicationsPolicy::class);
        Gate::policy('flexiplace.schedule', FlexiplaceSchedulePolicy::class);
        Gate::policy('flexiplace.dtr', FlexiplaceDtrPolicy::class);
        Gate::policy('flexiplace.reports', FlexiplaceReportsPolicy::class);
        Gate::policy('gap-analysis', GapAnalysisPolicy::class);
        Gate::policy('performance', PerformancePolicy::class);
        Gate::policy('settings', SettingsPolicy::class);
    }
}
