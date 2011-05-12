class AddIndexToLists < ActiveRecord::Migration
  def self.up
    add_index :lists, :token
  end

  def self.down
    remove_index :lists, :token
  end
end
