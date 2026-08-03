<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cleaning_tasks', function (Blueprint $table) {
            $table->unsignedBigInteger('group_id')->nullable()->after('assigned_to');
            $table->foreign('group_id')->references('id')->on('task_groups')->nullOnDelete();
            $table->index('group_id');
        });
    }

    public function down(): void
    {
        Schema::table('cleaning_tasks', function (Blueprint $table) {
            $table->dropForeign(['group_id']);
            $table->dropIndex(['group_id']);
            $table->dropColumn('group_id');
        });
    }
};
