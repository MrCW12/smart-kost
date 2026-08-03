<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_group_members', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('task_group_id');
            $table->unsignedBigInteger('user_id');
            $table->timestamps();

            $table->foreign('task_group_id')->references('id')->on('task_groups')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unique(['task_group_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_group_members');
    }
};
