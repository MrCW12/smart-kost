<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cleaning_task_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cleaning_task_id')->constrained()->cascadeOnDelete();
            $table->string('path', 500);
            $table->enum('type', ['before', 'after', 'during'])->default('before');
            $table->string('caption', 255)->nullable();
            $table->timestamps();

            $table->index('cleaning_task_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cleaning_task_photos');
    }
};
