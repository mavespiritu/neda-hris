<?php

namespace App\Traits;

use Illuminate\Support\Facades\DB;

trait CopiesApplicationData
{
    protected function copiesApplicationData($sourceTable, $targetTable, $sourceApplicantId, $newAppId, $single = false)
    {

        $db = 'db_neda_hris';
        $conn = DB::connection('mysql');

        // Fetch columns for both tables
        $targetColumns = $conn->getSchemaBuilder()->getColumnListing("$targetTable");
        $sourceColumns = $conn->getSchemaBuilder()->getColumnListing("$sourceTable");

        // Exclude auto-increment 'id'
        $targetColumns = array_filter($targetColumns, fn($col) => $col !== 'id');

        if (empty($targetColumns)) {
            \Log::warning("No columns found in $db.$targetTable. Skipping copy.");
            return;
        }

        // Build the SELECT list:
        // - Replace target's `application_id` with `$newAppId`
        // - Skip applicant_id if present
        $selectParts = [];
        foreach ($targetColumns as $col) {
            if ($col === 'application_id') {
                $selectParts[] = "$newAppId as application_id";
                continue;
            }

            if ($col === 'applicant_id') {
                // Never copy applicant_id → skip
                continue;
            }

            if (in_array($col, $sourceColumns)) {
                $selectParts[] = $col;
            } else {
                // If target column doesn't exist in source (maybe a new one)
                $selectParts[] = "NULL as $col";
            }
        }

        $columnsList = implode(", ", $targetColumns);
        $selectList  = implode(", ", $selectParts);

        // Detect if the source table has applicant_id column
        $hasApplicantId = in_array('applicant_id', $sourceColumns);

        // Build WHERE clause conditionally
        $whereClause = $hasApplicantId
            ? "WHERE applicant_id = ?"
            : "WHERE id = ?";

        // Build final SQL
        $query = "INSERT INTO $db.$targetTable ($columnsList)
                SELECT $selectList FROM $db.$sourceTable
                $whereClause";

        if ($single) {
            $query .= " LIMIT 1";
        }

        // Execute the insert
        $conn->insert($query, [$sourceApplicantId]);

        \Log::info("Copied data from $sourceTable to $targetTable for applicant_id=$sourceApplicantId as application_id=$newAppId");
    }
}
