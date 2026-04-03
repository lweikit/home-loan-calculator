'use client';

import { useDarkMode } from '@/components/hooks/use-dark-mode';
import { useCalculator } from '@/components/hooks/use-calculator';
import { useUrlState } from '@/components/hooks/use-url-state';
import PropertyProfile from '@/components/inputs/property-profile';
import FinancialDetails from '@/components/inputs/financial-details';
import GrantInputsView from '@/components/inputs/grant-inputs';
import SummaryCard from '@/components/results/summary-card';
import ExportPdfButton from '@/components/common/export-pdf';
import Collapsible from '@/components/common/collapsible';
import AffordabilityResult from '@/components/results/affordability-result';
import GrantResultView from '@/components/results/grant-result';
import TenureWarnings from '@/components/results/tenure-warnings';
import CostBreakdownView from '@/components/results/cost-breakdown';
import LoanComparison from '@/components/results/loan-comparison';
import AmortisationView from '@/components/results/amortisation-view';
import CpfSimulatorView from '@/components/results/cpf-simulator-view';
import CpfCashComparisonView from '@/components/results/cpf-cash-comparison';
import TotalCostView from '@/components/results/total-cost-view';
import RefinancingView from '@/components/results/refinancing-view';
import BtoProgressiveView from '@/components/results/bto-progressive-view';
import ProgressivePaymentView from '@/components/results/progressive-payment-view';

export default function Page() {
  const { isDark, toggleDarkMode } = useDarkMode();
  const { inputs, updateInput, effectiveIncome, results, reset, eligibility } = useCalculator();
  useUrlState(inputs, updateInput);

  const showResults = results && eligibility.canProceed;

  return (
    <div className="min-h-screen flex flex-col bg-secondary">
      {/* Header */}
      <header className="text-white py-4 shadow-md sticky top-0 z-50 bg-primary-dark">
        <div className="container mx-auto flex items-center justify-between px-4">
          <div className="text-lg sm:text-xl font-bold">Home Loan Calculator</div>
          <div className="flex items-center gap-2">
            {showResults && <ExportPdfButton targetId="results-section" />}
            <button
              onClick={reset}
              className="text-xs px-3 py-1.5 rounded-md border border-white/30 text-white hover:bg-white/10 transition"
            >
              Reset
            </button>
            <button
              onClick={toggleDarkMode}
              className="px-2 py-2 rounded-full border border-white/30 hover:bg-white/10 transition-all duration-300"
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>
            <a
              href="https://ko-fi.com/weikit"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-block px-4 py-2 bg-accent text-white text-sm font-semibold hover:bg-accent-light rounded-lg transition-all duration-300"
            >
              Buy Me a Coffee
            </a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 flex-1">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Input Section */}
          <PropertyProfile inputs={inputs} updateInput={updateInput} />
          <FinancialDetails
            inputs={inputs}
            updateInput={updateInput}
            effectiveIncome={effectiveIncome}
          />
          <GrantInputsView inputs={inputs} updateInput={updateInput} />

          {/* Eligibility Issues */}
          {eligibility.issues.length > 0 && (
            <div className="space-y-2">
              {eligibility.issues.map((issue, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border text-sm flex items-start gap-2 ${
                    issue.type === 'blocker'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                      : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                  }`}
                >
                  <span className="shrink-0 font-bold">{issue.type === 'blocker' ? '!!' : '!'}</span>
                  <span>{issue.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Results */}
          {showResults && (
            <div id="results-section" className="space-y-4">
              {/* Sticky Summary */}
              <SummaryCard
                hdbEligible={results.hdbEligibility.eligible}
                hdbMonthly={results.hdbMonthly}
                bankMonthly={results.bankMonthly}
                totalCashNeeded={results.hdbEligibility.eligible
                  ? results.hdbCosts.totalCashOutlayLow
                  : results.bankCosts.totalCashOutlayLow}
                totalCpfUsed={results.hdbEligibility.eligible
                  ? results.hdbDownpayment.cpfUsedTotal
                  : results.bankDownpayment.cpfUsedTotal}
                grants={results.grants}
                propertyPrice={inputs.propertyPrice}
              />

              <GrantResultView grants={results.grants} />

              <Collapsible title="Affordability & Loan Eligibility" defaultOpen>
                <AffordabilityResult
                  hdbAffordability={results.hdbAffordability}
                  bankAffordability={results.bankAffordability}
                  hdbEligibility={results.hdbEligibility}
                  effectiveIncome={results.effectiveIncome}
                  propertyType={inputs.propertyType}
                />
              </Collapsible>

              <Collapsible title="Cost Breakdown" defaultOpen>
                <CostBreakdownView
                  hdbCosts={results.hdbCosts}
                  bankCosts={results.bankCosts}
                  hdbEligible={results.hdbEligibility.eligible}
                  propertyType={inputs.propertyType}
                />
              </Collapsible>

              <Collapsible title="Loan Comparison">
                <LoanComparison
                  hdbEligible={results.hdbEligibility.eligible}
                  hdbLoanAmount={results.hdbLoanAmount}
                  hdbMonthly={results.hdbMonthly}
                  hdbTenure={results.hdbTenure}
                  hdbTotalInterest={results.hdbTotalInterest}
                  bankLoanAmount={results.bankLoanAmount}
                  bankMonthly={results.bankMonthly}
                  bankTenure={results.bankTenure}
                  bankTotalInterest={results.bankTotalInterest}
                  bankRate={inputs.bankRate}
                />
                <div className="mt-4">
                  <TenureWarnings
                    youngestAge={inputs.youngestAge}
                    propertyType={inputs.propertyType}
                    remainingLease={inputs.remainingLease}
                    hdbTenure={results.hdbTenure}
                    bankTenure={results.bankTenure}
                    hdbEligible={results.hdbEligibility.eligible}
                  />
                </div>
              </Collapsible>

              <Collapsible title="Amortisation Schedule">
                <AmortisationView
                  hdbAmortisation={results.hdbAmortisation}
                  bankAmortisation={results.bankAmortisation}
                  hdbEligible={results.hdbEligibility.eligible}
                />
              </Collapsible>

              <Collapsible title="CPF Usage & Accrued Interest">
                <CpfSimulatorView
                  simulation={results.cpfSimulation}
                  loanLabel={results.hdbEligibility.eligible ? 'HDB Loan' : 'Bank Loan'}
                />
              </Collapsible>

              <Collapsible title="Cash vs CPF Strategy">
                <CpfCashComparisonView strategies={results.cpfCashStrategies} />
              </Collapsible>

              {results.btoSchedule && (
                <Collapsible title="BTO Payment Schedule" defaultOpen>
                  <BtoProgressiveView schedule={results.btoSchedule} />
                </Collapsible>
              )}

              {results.progressiveSchedule && (
                <Collapsible title="Progressive Payment Schedule" defaultOpen>
                  <ProgressivePaymentView
                    schedule={results.progressiveSchedule}
                    propertyType={inputs.propertyType}
                  />
                </Collapsible>
              )}

              <Collapsible title="Total Cost of Ownership">
                <TotalCostView
                  propertyPrice={inputs.propertyPrice}
                  propertyType={inputs.propertyType}
                  flatSize={inputs.flatSize}
                  loanAmount={results.hdbEligibility.eligible ? results.hdbLoanAmount : results.bankLoanAmount}
                  totalInterest={results.hdbEligibility.eligible ? results.hdbTotalInterest : results.bankTotalInterest}
                  bsd={results.hdbCosts.bsd}
                  absd={results.hdbCosts.absd}
                  legalFeeLow={results.hdbCosts.legalFeeLow}
                  legalFeeHigh={results.hdbCosts.legalFeeHigh}
                  optionFee={inputs.optionFee}
                  exerciseFee={results.exerciseFee}
                />
              </Collapsible>

              <Collapsible title="Refinancing Analysis">
                <RefinancingView
                  loanAmount={results.hdbEligibility.eligible ? results.hdbLoanAmount : results.bankLoanAmount}
                  currentRate={results.hdbEligibility.eligible ? 2.6 : inputs.bankRate}
                  remainingTenure={results.hdbEligibility.eligible ? results.hdbTenure : results.bankTenure}
                  isHdbLoan={results.hdbEligibility.eligible}
                  propertyPrice={inputs.propertyPrice}
                />
              </Collapsible>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-6">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between text-sm px-4">
          <div className="text-center sm:text-left">
            <p>
              &copy; {new Date().getFullYear()} Home Loan Calculator. Built by{' '}
              <a
                href="https://www.weikit.me"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-light transition"
              >
                Wei Kit
              </a>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              For reference only. Verify with HDB / your bank before committing.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-4">
            <a
              href="https://ko-fi.com/weikit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition sm:hidden"
            >
              Buy Me a Coffee
            </a>
            <a
              href="mailto:al.weikit@gmail.com"
              className="text-gray-400 hover:text-white transition"
              title="Email for Feature Requests"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </a>
            <a
              href="https://www.github.com/lweikit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition"
              title="GitHub"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
            <a
              href="https://sg.linkedin.com/in/weikit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition"
              title="LinkedIn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
